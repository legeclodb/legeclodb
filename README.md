# れじぇくろDB

[れじぇくろ！](https://www.legend-clover.net/) の攻略データベースです。https://legeclodb.github.io/ のソースコードになります。  
[Vue.js](https://vuejs.org/) で実装されています。ローカルで実行する場合、[Node.js](https://nodejs.org/en/) をインストールした上で以下のコマンドを実行します。
```
npm install -g @vue/cli
npm install
npm run serve
```
正常に起動すれば https://localhost:8080/ で見れるようになるはずです。  
以下のコマンドでビルドしてデプロイ可能な状態にします。docs/ 以下に成果物が生成されます。
```
npm run build
```
キャラ、スキル、アイテムの追加や編集は src/assets 内の .json ファイルを編集することで可能です。この場合、プログラムの変更は不要です。
