FROM ubuntu:20.04

COPY requirements.txt requirements.txt

RUN apt-get update && \
    apt-get install openjdk-11-jdk -y && \
    apt-get install -y python3 && \
    apt-get install -y python3-pip && \
    apt-get install -y libpcre3 libpcre3-dev && \
    python3 -m pip install -r requirements.txt && \
    mkdir -p /root/.ir_datasets/downloads
    # mkdir -p /root/.ir_datasets/downloads && \
    # mkdir -p /root/.ir_datasets/downloads/0368ee47ce0ec8bed837c7e22c024493 && \
    # ln -s datasets/argsme_compressed/debateorg.zip /root/.ir_datasets/downloads/0368ee47ce0ec8bed837c7e22c024493/debateorg.zip

COPY . .

EXPOSE 7002

ENTRYPOINT python3 app.py