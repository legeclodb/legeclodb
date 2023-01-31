# legeclodb

[れじぇくろ！](https://www.legend-clover.net/) の攻略データベースです。https://i-saint.github.io/legeclodb/ のソースコードとなります。  
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
キャラやスキルの追加・編集は、public の中の .json ファイルを編集することで行います。この場合、プログラムの変更は不要です。