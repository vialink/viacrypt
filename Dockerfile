FROM node

RUN apt-get update \
    && apt-get install -y \
       git \
       sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN useradd -r --shell /bin/bash --create-home viacrypt

RUN mkdir -p /data \
    && cd /data \
    && chown -R viacrypt:viacrypt /data \
    && sudo -u viacrypt git clone https://github.com/vialink/viacrypt.git ./ \
    && sudo -u viacrypt npm install \
    && npm install -g grunt-cli \
    && sudo -u viacrypt grunt

WORKDIR /data
USER viacrypt

EXPOSE 8001

CMD ["grunt", "run"]