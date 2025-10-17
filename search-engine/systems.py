import os
import pyterrier as pt
pt.init()

import ir_datasets
import json

DATASET = 'irds:argsme/2020-04-01/touche-2020-task-1'
IDX_PATH = './index/argsme'

class Ranker(object):

    def __init__(self, wmodel):
        self.idx = None
        self.wmodel = wmodel
        self.wmodel = 'BM25'
        self.dataset = ir_datasets.load("argsme/2020-04-01/touche-2020-task-1")
        self.docstore = self.dataset.docs_store()

    def index(self):
        
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
                    item =  self.docstore.get(i)
                    internal_id = meta_index.getDocument("docno", i)
                    itemlist.append(                                            # Adjust to the data fields that the collection you want to use provides (Corresponding don't have to be adjusted)
                        {
                            'title': meta_index.getItem('title', internal_id),
                            'argument': item.premises_texts,
                            'source_title' : item.source_title,
                            'date': item.date,
                            'docid' : item.doc_id
                        }
                    )
                    
                   
        return {
            'page': page,
            'rpp': rpp,
            'query': query,
            'itemlist': itemlist,
            'num_found': len(itemlist)
        }
