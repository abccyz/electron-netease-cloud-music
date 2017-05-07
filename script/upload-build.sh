#!/bin/bash

cd dist
wget http://devtools.qiniu.com/qshell-v2.0.5.zip -O qshell.zip
unzip qshell.zip qshell_linux_amd64
./qshell_linux_amd64 account $QINIU_AK $QINIU_SK

APP_NAME=electron-netease-cloud-music
BUCKET_NAME=$APP_NAME-dev
VERSION_HASH="$NCM_RELEASE_CHANNEL.`git rev-parse --short HEAD`"

./qshell_linux_amd64 listbucket $BUCKET_NAME stdout

for ARCH in linux-x64 darwin-x64
do
    if [[ $NCM_RELEASE_CHANNEL != "master" ]]; then
        echo $VERSION_HASH > $APP_NAME-$ARCH/ncm_hash
    fi
    TAR_NAME=$ARCH-$VERSION_HASH.tar.gz
    tar zcf $TAR_NAME $APP_NAME-$ARCH
    ./qshell_linux_amd64 rput $BUCKET_NAME $TAR_NAME $TAR_NAME
done
