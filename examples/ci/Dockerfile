# SPDX-License-Identifier: MIT
#
# Yocto 6.0 derlemeleri için kurum içi konteyner imajı (Bölüm 18).
#
#   docker build -t ornek-yocto:wrynose examples/ci
#   docker run --rm -it -v /srv/yocto-ci:/srv/yocto-ci -v "$PWD":/work ornek-yocto:wrynose
#
# Temel imaj sürümü sabitlenmelidir; desteklenen dağıtımlar için
# Yocto Reference Manual -> System Requirements bölümüne bakılmalıdır.

FROM ubuntu:24.04

ARG DEBIAN_FRONTEND=noninteractive
ARG KULLANICI_UID=1000

# Ana makine paketleri (Bölüm 3) ve testimage için gereken ağ araçları
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential chrpath cpio debianutils diffstat file gawk gcc git \
        iputils-ping iproute2 libacl1 libcrypt-dev locales lz4 python3 python3-git \
        python3-jinja2 python3-pexpect python3-pip python3-subunit python3-venv \
        python3-websockets socat texinfo unzip wget xz-utils zstd \
        openssh-client ca-certificates jq \
    && rm -rf /var/lib/apt/lists/* \
    && locale-gen en_US.UTF-8

ENV LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8

# BitBake root kullanıcısıyla çalışmaz. Ubuntu imajındaki varsayılan kullanıcı kaldırılır
# ve aynı UID ile derleme kullanıcısı oluşturulur (bağlanan dizinlerde izin sorunu olmaması için).
RUN (userdel -r ubuntu 2>/dev/null || true) \
    && useradd -m -u ${KULLANICI_UID} -s /bin/bash yocto

USER yocto
RUN python3 -m venv /home/yocto/bbsetup \
    && /home/yocto/bbsetup/bin/pip install --no-cache-dir bitbake-setup
ENV PATH=/home/yocto/bbsetup/bin:$PATH

WORKDIR /work
