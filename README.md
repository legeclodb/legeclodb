# れじぇくろDB

[れじぇくろ！](https://www.legend-clover.net/) の攻略データベースです。https://legeclodb.github.io/ のソースコードになります。  
[Vue.js](https://vuejs.org/) で実装されています。ローカルで実行する場合、以下のコマンドを実行します。
```
npm install -g @vue/cli
npm run serve
```
正常に起動すれば https://localhost:8080/ で見れるようになるはずです。  
以下のコマンドでビルドしてデプロイ可能な状態にします。
```
npm run build
```
キャラ、スキル、装備の追加や編集は src/assets 内の .json ファイルを編集することで可能です。この場合、プログラムの変更は不要です。