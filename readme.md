# takcast.output.webmfile

# 作者

taktod

https://twitter.com/taktod

poepoemix@hotmail.com

# 概要

electronで作ってみる配信ツールのtakcastで利用する
rtmpとして配信するプラグイン

# 使い方

takcastのプロジェクトで

```
$ npm install taktod/takcast.output.rtmp --save
$ npm run setup
```

を実行するとプラグインがインストールされて
必要な情報がセットアップされます。

# takcastとは

electronを使って作ってみた、映像と音声を合成して配信するツール
元ネタは、勤めている会社にopenGLで映像合成をしたらどのようになるか提示するのに作ってみたプログラムです。
せっかくなので公開してみようと思いました。

# 構成

## node/index.ts

node側処理用のpluginエントリー
このプログラムでは利用可能なencoderを通知したり、h264やaacに変換を実施したりします。

## render/index.ts

render側処理用のpluginエントリー
media pluginが作成したデータをyuvイメージのbinaryにしたり、pcmデータに変換して node側に投げます。

## render/ui/settingComponent.tsx

このpluginの動作を設定するfooterに表示される設定項目のGUI設定

## render/ui/setting.tsx

このpluginの詳細動作を設定するダイアログを処理します。

# あらたなコーデックを追加する場合のメモ

h264やaacのencoderを追加する場合のメモ
src/node/index.tsにプログラムを追加します。

1. まずnode-gypあたりで適当にencodeできるプログラムを作ります。

2. 次に46行目あたりcodecListに追加したいcodec名をいれます。
大文字からはじめて被らないようにしておけばいいと思います。
例えばHogeというコーデックをつくるとします。

3. 2で設定した名前と同じprivateのメソッドを作成します。
private Hoge(target) {
}

4. targetがnullの場合
コーデック情報を登録し、設定画面にでてくるようにします。
jsonの形で設定をいれます。
aacEncoderの場合はaudioCodecsに
h264Encoderの場合はvideoCodecsに
対象のjsonをいれればOKです。

対象のjsonの構成
codec: コーデック名です。2で設定した名前と同じものをいれてください。
name: 設定ダイアログのselectに表示されるエンコーダーの名前となります。
channelNum: 1 動作チャンネル数です。aacEncoderの場合必須
sampleRate: 44100 動作サンプルレートです。aacEncoderの場合必須
semiPlanar: false h264Encoderで利用するyuvイメージがnv12の場合にはtrueにしておいてください。yuv420 planarの場合はfalseとなります。
width: 320 横幅、h264Encoderの場合必須
height: 240 縦幅、h264Encoderの場合必須
その他なにか必要があれば追記できます。
内容がobjectの場合は設定項目となります。
内容がobjectでない場合は、その値がそのまま設定データとして送られてきます。

設定項目の場合
{type: } 項目のタイプです。
  text テキスト入力
    type: "text", value: "デフォルト値"
  textarea テキストエリア
    type: "textarea" value: "デフォルト値" 
  select プルダウンによるセレクト動作
    type: "select" value: "デフォルト値" values:["配列で値をいれておく"] valuesの要素のうちデフォルト値と一致するのが初めから選択された状態になります。
  checkbox チェックボックス
    type: "checkbox" value: trueだったら初めからチェックされてる 

追加、変更したい場合は
src/render/ui/setting.tsxを書き換える感じで


# issue

修正すべきところ
x264やopenh264のparams設定等の部分まだちゃんと作ってないので、パラメーターの調整できない状態になってるので、直しておきたい。

あとはこのparamsやspatualLayerSettingの部分をちゃんと反映させる件だな。