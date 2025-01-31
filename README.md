### How to release

1. Download all zip files from a release.
2. Upload all zips to s3://devprotocol-clubs/clubs/\_lambda-layers/place/capture and override them.
3. Access Lambda/Layers/chromium and click `Create version` -> `Upload a file from Amazon S3` and input `https://devprotocol-clubs.s3.us-east-1.amazonaws.com/clubs/_lambda-layers/place/capture/chromium.zip`, set Compatible architectures = x86_64, set Compatible runtimes == Node.js 22.x + Node.js 20.x, then create.
4. Access Lambda/Layers/libs and click `Create version` -> `Upload a file from Amazon S3` and input `https://devprotocol-clubs.s3.us-east-1.amazonaws.com/clubs/_lambda-layers/place/capture/libs.zip`, set Compatible architectures = x86_64, set Compatible runtimes == Node.js 22.x + Node.js 20.x, then create.
5. Access Lambda/Layers/fonts and click `Create version` -> `Upload a file from Amazon S3` and input `https://devprotocol-clubs.s3.us-east-1.amazonaws.com/clubs/_lambda-layers/place/capture/fonts.zip`, set Compatible architectures = x86_64, set Compatible runtimes == Node.js 22.x + Node.js 20.x, then create.
6. Access Lambda/Functions/capture-screenshots and click `Upload from` -> `Amazon S3 location` and input `https://devprotocol-clubs.s3.us-east-1.amazonaws.com/clubs/_lambda-layers/place/capture/lambda.zip`, and edit layers to use all of the latest versions,then publish new version on the console.
