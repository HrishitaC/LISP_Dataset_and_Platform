import os
import pyterrier as pt
pt.init()

import ir_datasets
import json
import pandas as pd

DATASET = 'irds:argsme/2020-04-01/touche-2020-task-1'
# IDX_PATH = './index/argsme'
IDX_PATH = './index/kid-friend'

class Ranker(object):

    def __init__(self, wmodel):
        self.idx = None
        self.wmodel = wmodel
        self.wmodel = 'BM25'
        
        with open(r'datasets/kid-friend/documents.jsonl') as f:
            lines = f.read().splitlines()

        line_dicts = [json.loads(line) for line in lines]
        kid_friend_df_final = pd.DataFrame(line_dicts)
        self.dataset = kid_friend_df_final
        
        # self.dataset = ir_datasets.load("argsme/2020-04-01/touche-2020-task-1")
        # self.docstore = self.dataset.docs_store()

    def index(self):

        # dataset = self.dataset
        # def kid_friend_iter():
        #     for i, row in dataset.iterrows():
        #         yield {
        #             "docno": row["docno"],
        #             "title": row["title"],
        #             "snippet": row["snippet"],
        #             "text": row["main_content"]
        #         }

        # kid_friend_idx_path = "./index/kid-friend"
        # kid_friend_indexer = pt.IterDictIndexer(
        #     index_path = str(kid_friend_idx_path),
        #     meta={ # metadata recorded in index
        #         "docno": max([len(docno) for docno in dataset["docno"]]),
        #         "title": max([len(title) for title in dataset["title"]]),
        #         "snippet": max([len(snippet) for snippet in dataset["snippet"]]),
        #         "text": max([len(main_content) for main_content in dataset["main_content"]])
        #     },
        #     text_attrs = ["text"], # columns indexed
        #     stemmer="porter",
        #     stopwords="terrier",
        # )

        # self.idx = kid_friend_indexer.index(kid_friend_iter())

        
        dataset = pt.get_dataset(DATASET)

        title_dict = {}
        with open("index/titles.json") as f:
            for line in f:
                l = json.loads(line)
                key, value = next(iter(l.items()))
                title_dict[key] = value

        def filter_dataset():
            seen = set()
            for i, doc in enumerate(dataset.get_corpus_iter()):
                doc_id = doc['docno']
                if doc_id not in seen:
                    seen.add(doc_id)
                    if len(doc['premises_texts']) > 100 and len(doc['premises_texts']) < 3000:
                        title = title_dict.get(doc_id)
                        if not title:
                            continue
                        doc['title'] = title
                        yield doc

        indexer = pt.IterDictIndexer(IDX_PATH, meta={'docno': 39, 'title':256}, fields=['title', 'conclusion', 'premises_texts', 'aspects_names', 'source_id', 'source_title', 'topic', 'source_url', 'date'],text_attrs=['premises_texts'])
        self.idx = indexer.index(filter_dataset())

    def rank_publications(self, query, page, rpp):

        itemlist = []
        import os
       
        idx_path_abs = os.path.abspath(os.path.join(IDX_PATH, 'data.properties'))
    
        if query is not None:
            if self.idx is None:
                try:
                    self.idx = pt.IndexFactory.of(os.path.join(IDX_PATH, 'data.properties'))
                except Exception as e:
                    print('No index available: ', e)
            if self.idx is not None:

                meta_index = self.idx.getMetaIndex()

                wmodel = pt.BatchRetrieve(self.idx, controls={"wmodel": self.wmodel})
                items = wmodel.search(query)['docno'][page*rpp:(page+1)*rpp].tolist()
                itemlist = []
                for i in items: 
                    # item =  self.docstore.get(i)
                    item =  self.dataset.loc[self.dataset["docno"]==i]
                    internal_id = meta_index.getDocument("docno", i)
                    itemlist.append(                                            # Adjust to the data fields that the collection you want to use provides (Corresponding don't have to be adjusted)
                        {
                            'title': meta_index.getItem('title', internal_id),
                            'snippet': item.premises_texts,
                            'source_title' : item.source_title,
                            'date': item.date,
                            'docid' : item.doc_id
                        }
                    )
                    # itemlist.append(                                            # Adjust to the data fields that the collection you want to use provides (Corresponding don't have to be adjusted)
                    #     {
                    #         'title': item.title.values[0],
                    #         'snippet': item.snippet.values[0],
                    #         # 'source_title' : item.source_title,
                    #         # 'date': item.date,
                    #         'docid' : item.docno.values[0]
                    #     }
                    # )
                    
                   
        return {
            'page': page,
            'rpp': rpp,
            'query': query,
            'itemlist': itemlist,
            'num_found': len(itemlist)
        }
