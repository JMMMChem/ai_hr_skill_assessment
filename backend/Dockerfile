FROM node:18.16.0 AS frontend

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend .

RUN npm run build

FROM python:3.11.4-slim

ARG USERNAME=raytell
ARG USER_UID=1000
ARG USER_GID=$USER_UID

ENV USERNAME=$USERNAME
ENV USER_UID=$USER_UID
ENV USER_GID=$USER_GID
ENV PYTHONUNBUFFERED=1
ENV TZ=Europe/Madrid
ENV GRPC_DNS_RESOLVER="native"

RUN apt-get update && \
    apt-get install -y gcc git g++ build-essential libssl-dev pkg-config ca-certificates libasound2 wget libpq-dev sox ffmpeg tzdata libgeos-dev && \
    wget -O - https://www.openssl.org/source/openssl-1.1.1u.tar.gz | tar zxf - && \
    cd openssl-1.1.1u && \
    ./config --prefix=/usr/local && \
    make -j $(nproc) && \
    make install_sw install_ssldirs && \
    ldconfig -v && \
    export SSL_CERT_DIR=/etc/ssl/certs && \
    cd ../ && \
    rm -rf openssl-1.1.1u

ENV SSL_CERT_DIR=/usr/lib/ssl/certs

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME

WORKDIR /home/${USERNAME}/app

ENV PATH="/home/${USERNAME}/.local/bin:${PATH}"

# Fix for oscrypto
RUN pip install -U git+https://github.com/wbond/oscrypto.git@d5f3437
RUN pip install -U "watchdog[watchmedo]" flower


COPY --from=frontend /app/dist ../frontend/dist
RUN ln -s /home/${USERNAME}/frontend/dist ./frontend

COPY backend/requirements.txt ./requirements.txt
RUN pip install -U -r requirements.txt

COPY backend ./

EXPOSE 8000

CMD alembic upgrade head && uvicorn app:app --host 0.0.0.0 --port 8000