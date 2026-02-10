# [ECIR2026] LISP - A Rich Interaction Dataset and Loggable Interactive Search Platform

This repository accompanies the resource paper submission "LISP - A Rich Interaction Dataset and Loggable Interactive Search Platform" for ECIR 2026. It contains all data collected during the user study, as well as the full setup used to conduct the study. This enables others to either reproduce our results in a new user study or adapt the framework to create their own study.

## Structure of this Repository

* `logs/`: Contains the log files of the user study and additional metadata from the Perceptual Speed Test and both questionnaires
* `ps-test/`: Contains the implementation of the online Perceptual Speed Test
* `search-app/`: Contains the implementation of the front end of the search engine used in the user study
* `search-engine/`: Contains the implementation of the search engine backend

## Structure of the README

The [setup section](#setup) which appears first, explains how to install and run the framework. The [next section](#conducting-your-own-user-study) describes which parts of the code you need to adapt if you want to configure and run your own user study using this framework.


# Setup

1. Run docker-compose.yml
```
bash
docker-compose up --build
```
2. After building the docker images you can access the fronted via:
```
bash
http://[Enter Server-IP Address here]:7001/
```
> [!NOTE]  
> Make sure that you have all necessary files in place (see instructions below)
  
## Conducting your own user study

# `search-app/data`

This folder contains the participant data for the study. It includes two files:

1. `uids.txt`

A list of participant usernames, separated by newlines.

- Used to populate the dropdown menu in the study application.
- Each username must match the uid field in user_topics.csv.

**Example:**

```txt
Participant1
Participant2
Participant3
Participant4
Participant5
Participant6
Participant7
```

2. `user_topics.csv`

A csv file that assigns topics to each participant, based on their preferences from the pre-study questionnaire.

- Each row links a participant (uid) to one topic.
- The "high_interest_topic_column" indicates whether the user’s high-interest topic is in the first or second topic column.

**Structure:**

```csv
uid,topic1_keyword,topic1_question,topic2_keyword,topic2_question,high_interest_topic_column
```

**Example:**

```csv
Participant35,Birth control pills,Should birth control pills be available over the counter?,Marijuana as medial option,Should marijuana be a medical option?,second
Participant27,Abortion,Should abortion be legal?,Cell phone radiation,Is cell phone radiation safe?,first
Participant58,Alternative energy,Can alternative energy effectively replace fossil fuels?,Vegetarianism,Should people become vegetarian?,second
Participant57,Obesity,Is obesity a disease?,Gay Marriage,Should gay marriage be legal?,second
```

## Usage in the study

- The application reads uids.txt to display available participants in a dropdown menu.
- After a participant is selected, their assigned topics are retrieved from user_topics.csv.
- This ensures that each participant works on the topics they indicated interest in during the pre-study questionnaire.

## Notes

- Keep usernames consistent across both files.
- Use semicolons (;) as separators in the CSV.
- You can assign any number of topics to a participant by adding more rows with the same uid.



# `search-app/templates`

These are all changes that are necessary to customize the layout according to your desired task. The underlying ids don't need to be changed, even if names don't fit to your labels.

## ``welcome.html``

Adjust the landing page content text here, if you want to.

## ``task.html``

Adjust the text in this file to match your task description.

## ``search.html``

To rename the button labels, change it here.

```html
<div style="display: flex; justify-content: flex-end; gap: 0.5em; margin-top: 0.5em;" id="buttons-{{ loop.index }}">
  <button type="button"
          data-type="pro"
          class="btn btn-outline-success btn-no-focus"
          data-index="{{ loop.index }}"
          data-rank="{{loop.index + 10*(page-1)}}"
          did = {{s.docid}}
          onclick="toggleArgument('{{ s.docid }}', 'pro')"
          id="pro-btn-{{ s.docid }}">
    Pro                                                      <!-- Change button label here --> 
  </button>

  <button type="button"
          data-type="con"
          class="btn btn-outline-danger btn-no-focus"
          data-index="{{ loop.index }}"
          data-rank="{{loop.index + 10*(page-1)}}"
          did = {{s.docid}}
          onclick="toggleArgument('{{ s.docid }}', 'con')"
          id="con-btn-{{ s.docid }}">
  Con                                                        <!-- Change button label here -->
  </button>
</div>
```

In case you want to change the display of the results (e.g. longer snippets) you can adjust in the following loop.

```html
  <!-- Search Result Arguments-->
  {% for s in search_results %}     <!-- After adjusting the system.py regarding the data fields you might need to adapt the displayed data fields here (e.g. s.title, s.argument, ...)-->
        <article class="media content-section" id="result-{{ loop.index }}" result_rank="{{ loop.index }}" base_ir="{{ s.docid }}">
        <div class="media-body">
```


## ``layout.html``

Adjust the Sidebar description and labels here
```html
<h5>Task</h5>
  <p>
  Please find arguments for both sides of a debate regarding the question: <!--Change sidebar task description here--></p><p> <b>{{ reminder <!-- reminder correspondes to the Topic and can be changed in search_app.py -->}}</b>  
  </p> 

<div id="argument-counters" style="margin-top: 1em;">
    <p><b>Pro: <!--Enter your label here for the sidebar count--></b> <span id="pro-count">0</span></p>
    <p><b>Con: <!--Enter your label here for the sidebar count--></b> <span id="con-count">0</span></p>
</div>
```

Adjust the overview (before ending the task) here
```html
for (const docid in argumentSelections) {
    const li = document.createElement('li');
    li.textContent = (argumentSelections[docid].toUpperCase() === 'PRO' ? 'PRO: ' : 'CON: ') + savedTitles[docid] || `ID: ${docid}`; // Change the labels for the Overview list of marked documents here
    li.classList.add(argumentSelections[docid] === 'pro' ? 'pro-vote' : 'con-vote');
    savedTitlesUl.appendChild(li);
}
```



## `end.html`

If you would like your participants to fill out a post-study questionnaire,  
add the link to your questionnaire in `end.html`.  

**Example:**  
```html
<a href="https://your-questionnaire-link.com" target="_blank" rel="noopener noreferrer">
  Go to Poststudy Questionnaire
</a>
```

# `search-app/static/logger.js`

If you want to log additional signals or change the default logging output, you can adjust it here. 

# `search-app/search_app.py`

The SECRET_KEY is used by Flask to securely sign session cookies and protect against tampering.
Set it to a strong, random value to ensure that user session data and other security-related features (like CSRF protection) remain safe.

```python
app.config['SECRET_KEY'] = ''       # Please set a secret key
```

If you want to customize the workflow sequence of the webpages in your userstudy, you can adjust the routes in this file.

If you want to adjust the reminder on the sidebar (Default: Topic), you can do this here.

```python
@app.route("/")
def home():
    if 'user_id' not in session:
        return redirect(url_for('welcome'))
    form = SearchForm()
    reminder = USER_TOPICS.get(session.get('user_id'), {}).get(str(session.get('task_number'))+'_full')  # Change reminder here if needed (Reminder: shown in sidebar)
    return render_template("home.html", form=form, show_search=True, reminder=reminder)
```


# `ps-test/php/db.php`

To store data from the perceptual speed test or to display the scoreboard, please set up a MySQL database and provide your credentials here.

**Example:**
```php
$host = 'localhost';          
$db   = '';                       // Add the name of your database here
$user = '';                       // Add your username here
$pass = '';                       // Add your password here  
$charset = 'utf8mb4';
```

The database is expected to contain the following columns (unless you choose to modify them):

```
user_id, score, amount_n, amount_n_correct, amount_j, amount_j_correct
```

# `search-engine/systems.py`

## Modifying the test collection or preprocessing
If you want to use a different test collection or adjust the preprocessing steps described in the paper, you need to modify `systems.py`.

### 1. Adjusting the ranking function or test collection

Edit the `__init__` function:

```python
def __init__(self, wmodel):
    self.idx = None
    self.wmodel = wmodel
    self.wmodel = 'BM25'             # Ranking model to use (default: 'BM25')
    self.dataset = ir_datasets.load("argsme/2020-04-01/touche-2020-task-1")
    self.docstore = self.dataset.docs_store()
```
> [!NOTE]  
> Replace "argsme/2020-04-01/touche-2020-task-1" with your desired IR dataset.

2. Handling document titles and filtering

If your dataset provides titles, or you want to add your own, and/or filter documents differently, modify the following:

```python
title_dict = {}
with open("index/titles.json") as f:
    for line in f:
        l = json.loads(line)
        key, value = next(iter(l.items()))
        title_dict[key] = value

# Filter dataset and attach titles
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

# Create an indexer with specific fields
indexer = pt.IterDictIndexer(IDX_PATH, meta={'docno': 39, 'title':256}, fields=['title', 'conclusion', 'premises_texts', 'aspects_names', 'source_id', 'source_title', 'topic', 'source_url', 'date'],text_attrs=['premises_texts'])
```

3. In case your collection provides differing data fields please change it here. 

```python
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
```
In case you change the data field names or you have more or less data fields to display them adjust the `search.html` here.

```html
  <!-- Search Result Arguments-->
  {% for s in search_results %}     <!-- After adjusting the system.py regarding the data fields you might need to adapt the displayed data fields here (e.g. s.title, s.argument, ...)-->
        <article class="media content-section" id="result-{{ loop.index }}" result_rank="{{ loop.index }}" base_ir="{{ s.docid }}">
        <div class="media-body">
```
