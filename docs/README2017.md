# 過去のサブプロジェクトの思考エンジン詰め合わせ

- 過去のサブプロジェクトの思考エンジンのダウンロードは[こちら](https://github.com/yaneurao/YaneuraOu/releases/tag/v4.73_engine2016)

# 過去のサブプロジェクト

## やねうら王2017 GOKU : SDT5に『極やねうら王』として出場。

2017年11月の第5回将棋電王トーナメントに参加してきました。(探索部の強さ、前バージョンからあまり変わらず)　Apery(SDT5)などの評価関数を用いるとXeon 24コアでR4200程度の模様。

## やねうら王2017 Early

2017年5月5日完成。この思考エンジンを用いたelmoがWCSC27で優勝しました。
2017年の将棋電王トーナメントではこの思考エンジンを用いた平成将棋合戦ぽんぽこが、優勝しました。
elmo(WCSC27)や蒼天幻想ナイツ・オブ・タヌキ(WCSC27出場)の評価関数を用いるとXeon 24コアでR4000程度の模様。

- 思考エンジン本体のダウンロードは[こちら](https://github.com/yaneurao/YaneuraOu/releases/)


## やねうら王2016 Late

第4回将棋電王トーナメント出場バージョン。「真やねうら王」

NDFの学習メソッドを用い、Hyperopt等を用いて各種パラメーターの調整を行い、技巧(2015)を超えた強さになりました。(R3650程度)
→　第4回将棋電王トーナメントは無事終えました。真やねうら王は3位に入賞しました。応援してくださった皆様、本当にありがとうございました。


## やねうら王2016 Mid

やねうら王 思考エンジン 2016年Mid版。Hyperopt等を用いて各種ハイパーパラメーターの調整の自動化を行ない自動調整します。長い持ち時間に対して強化しました。Apery(WCSC26)の評価関数バイナリを読み込めるようにしました。(R3450程度)


## やねうら王classic-tce

やねうら王classic-tceは、やねうら王classicのソースコードに持ち時間制御(秒読み、フィッシャールールに対応)、ponderの機能を追加したものです。(R3250程度)


## やねうら王classic

やねうら王classicは、やねうら王miniのソースコードを改良する形で、Apery(WCSC 2015)ぐらいの強さを目指しました。入玉宣言機能も追加しました。(R3000程度)


## やねうら王mini

やねうら王miniは、やねうら王nano plusを並列化して、将棋ソフトとしての体裁を整えたものです。Bonanza6より強く、教育的かつ短いコードで書かれています。全体で3000行程度、探索部500行程度。(R2700程度)


## やねうら王nano plus

やねうら王nano plusは、探索部300行程度で、オーダリングなどを改善した非常にシンプルでかつそこそこ強い思考エンジンです。(R2500程度)


## やねうら王nano

やねうら王nanoは1500行程度で書かれた将棋AIの基本となるプログラムです。探索部は150行程度で、非常にシンプルなコードで、αβ以外の枝刈りを一切していません。(R2000程度)


## やねうら王協力詰めsolver

『寿限無3』(49909手)も解ける協力詰めsolver →　[解説ページ](http://yaneuraou.yaneu.com/2016/01/02/%E5%8D%94%E5%8A%9B%E8%A9%B0%E3%82%81solver%E3%82%92%E5%85%AC%E9%96%8B%E3%81%97%E3%81%BE%E3%81%99/)


## やねうら王 王手将棋エディション

王手すると勝ちという変則ルールの将棋。世界最強の王手将棋になりました。(R4250)

## やねうら王 取る一手将棋エディション

合法な取る手がある場合は、必ず取らないといけないという変則ルールの将棋。

## 連続自動対局フレームワーク

連続自動対局を自動化できます。 python版のスクリプトも用意。今後は、python版のほうに注力します。


# 過去の評価関数ファイル

やねうら王 王手将棋エディション用

- [王手将棋用評価関数ファイルV1](https://drive.google.com/file/d/0Bzbi5rbfN85NOEF6QWFienZrSDg/) [解説記事](http://yaneuraou.yaneu.com/2016/11/21/%E7%8E%8B%E6%89%8B%E5%B0%86%E6%A3%8B%E5%B0%82%E7%94%A8%E8%A9%95%E4%BE%A1%E9%96%A2%E6%95%B0%E3%83%95%E3%82%A1%E3%82%A4%E3%83%ABv1%E3%81%8C%E5%87%BA%E6%9D%A5%E3%81%BE%E3%81%97%E3%81%9F/)
- [王手将棋用評価関数ファイルV2](https://drive.google.com/open?id=0Bzbi5rbfN85Nci02T3hkWm1yQlE) [解説記事](http://yaneuraou.yaneu.com/2016/11/22/%E7%8E%8B%E6%89%8B%E5%B0%86%E6%A3%8B%E7%94%A8%E8%A9%95%E4%BE%A1%E9%96%A2%E6%95%B0%E3%83%95%E3%82%A1%E3%82%A4%E3%83%ABv2%E3%82%92%E5%85%AC%E9%96%8B%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F/)
- [王手将棋用評価関数ファイルV3](https://drive.google.com/open?id=0Bzbi5rbfN85NVGJ3eHNtaHZhLXc) [解説記事](http://yaneuraou.yaneu.com/2016/11/23/%E7%8E%8B%E6%89%8B%E5%B0%86%E6%A3%8B%E7%94%A8%E8%A9%95%E4%BE%A1%E9%96%A2%E6%95%B0%E3%83%95%E3%82%A1%E3%82%A4%E3%83%ABv3%E3%82%92%E5%85%AC%E9%96%8B%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F/)
- [王手将棋用評価関数ファイルV4](https://drive.google.com/open?id=0Bzbi5rbfN85NcTIzaFVKU0ZfNU0) [解説記事](http://yaneuraou.yaneu.com/2016/11/23/%E7%8E%8B%E6%89%8B%E5%B0%86%E6%A3%8B%E7%94%A8%E8%A9%95%E4%BE%A1%E9%96%A2%E6%95%B0%E3%83%95%E3%82%A1%E3%82%A4%E3%83%ABv4%E3%82%92%E5%85%AC%E9%96%8B%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F/)
- [王手将棋用評価関数ファイルV5](https://drive.google.com/open?id=0Bzbi5rbfN85Na3ZOeE5zNUZpNkE) [解説記事](http://yaneuraou.yaneu.com/2016/11/24/%E7%8E%8B%E6%89%8B%E5%B0%86%E6%A3%8B%E7%94%A8%E8%A9%95%E4%BE%A1%E9%96%A2%E6%95%B0%E3%83%95%E3%82%A1%E3%82%A4%E3%83%ABv5%E3%82%92%E5%85%AC%E9%96%8B%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F/)
- [王手将棋用評価関数ファイルV6](https://drive.google.com/open?id=0Bzbi5rbfN85NeWxUWUFfMFdZSjQ) [解説記事](http://yaneuraou.yaneu.com/2016/11/29/%E7%8E%8B%E6%89%8B%E5%B0%86%E6%A3%8B%E7%94%A8%E8%A9%95%E4%BE%A1%E9%96%A2%E6%95%B0%E3%83%95%E3%82%A1%E3%82%A4%E3%83%ABv6%E3%82%92%E5%85%AC%E9%96%8B%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F/)

やねうら王nano,nano-plus,classic,classic-tce用
- CSAのライブラリの[ダウンロードページ](http://www.computer-shogi.org/library/)からダウンロードできます。

## 「Re : ゼロから始める評価関数生活」プロジェクト(略して「リゼロ」)

ゼロベクトルの評価関数(≒駒得のみの評価関数)から、「elmo絞り」(elmo(WCSC27)の手法)を用いて強化学習しました。従来のソフトにはない、不思議な囲いと終盤力が特徴です。

やねうら王2018 KPPT型の評価関数ファイルと差し替えて使うことが出来ます。フォルダ名に書いてあるepochの数字が大きいものほど新しい世代(強い)です。

- [リゼロ評価関数 epoch 0](https://drive.google.com/open?id=0Bzbi5rbfN85Nb3o1Zkd6cjVNYkE) : 全パラメーターがゼロの初期状態の評価関数です。
- [リゼロ評価関数 epoch 0.1](https://drive.google.com/open?id=0Bzbi5rbfN85NNTBERmhiMGZlSWs) : [解説記事](http://yaneuraou.yaneu.com/2017/06/20/%E5%BE%93%E6%9D%A5%E6%89%8B%E6%B3%95%E3%81%AB%E5%9F%BA%E3%81%A5%E3%81%8F%E3%83%97%E3%83%AD%E3%81%AE%E6%A3%8B%E8%AD%9C%E3%82%92%E7%94%A8%E3%81%84%E3%81%AA%E3%81%84%E8%A9%95%E4%BE%A1%E9%96%A2%E6%95%B0/)
- [リゼロ評価関数 epoch 1から4まで](https://drive.google.com/open?id=0Bzbi5rbfN85NNWY0RTJlc2x5czg) : [解説記事](http://yaneuraou.yaneu.com/2017/06/12/%E4%BA%BA%E9%96%93%E3%81%AE%E6%A3%8B%E8%AD%9C%E3%82%92%E7%94%A8%E3%81%84%E3%81%9A%E3%81%AB%E8%A9%95%E4%BE%A1%E9%96%A2%E6%95%B0%E3%81%AE%E5%AD%A6%E7%BF%92%E3%81%AB%E6%88%90%E5%8A%9F/)
- [リゼロ評価関数 epoch 5から6まで](https://drive.google.com/open?id=0Bzbi5rbfN85NSS0wWkEwSERZVzQ) : [解説記事](http://yaneuraou.yaneu.com/2017/06/13/%E7%B6%9A-%E4%BA%BA%E9%96%93%E3%81%AE%E6%A3%8B%E8%AD%9C%E3%82%92%E7%94%A8%E3%81%84%E3%81%9A%E3%81%AB%E8%A9%95%E4%BE%A1%E9%96%A2%E6%95%B0%E3%81%AE%E5%AD%A6%E7%BF%92/)
- [リゼロ評価関数 epoch 7](https://drive.google.com/open?id=0Bzbi5rbfN85NWWloTFdMRjI5LWs) : [解説記事](http://yaneuraou.yaneu.com/2017/06/15/%E7%B6%9A2-%E4%BA%BA%E9%96%93%E3%81%AE%E6%A3%8B%E8%AD%9C%E3%82%92%E7%94%A8%E3%81%84%E3%81%9A%E3%81%AB%E8%A9%95%E4%BE%A1%E9%96%A2%E6%95%B0%E3%81%AE%E5%AD%A6%E7%BF%92/)
- [リゼロ評価関数 epoch 8](https://drive.google.com/open?id=0Bzbi5rbfN85NMHd0OEUxcUVJQW8) : [解説記事](http://yaneuraou.yaneu.com/2017/06/21/%E3%83%AA%E3%82%BC%E3%83%AD%E8%A9%95%E4%BE%A1%E9%96%A2%E6%95%B0epoch8%E5%85%AC%E9%96%8B%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F%E3%80%82/)

## やねうら王 KPP_KKPT型用評価関数

やねうら王2018 KPP_KKPT型で使える評価関数です。

- [リゼロ評価関数 KPP_KKPT型 epoch4](https://drive.google.com/open?id=0Bzbi5rbfN85NSk1qQ042U0RnUEU) : [解説記事](http://yaneuraou.yaneu.com/2017/09/02/%E3%82%84%E3%81%AD%E3%81%86%E3%82%89%E7%8E%8B%E3%80%81kpp_kkpt%E5%9E%8B%E8%A9%95%E4%BE%A1%E9%96%A2%E6%95%B0%E3%81%AB%E5%AF%BE%E5%BF%9C%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F/)

## Shivoray(シボレー) 全自動雑巾絞り機

自分で自分好みの評価関数を作って遊んでみたいという人のために『Shivoray』(シボレー)という全自動雑巾絞り機を公開しました。

- [ShivorayV4.71](https://drive.google.com/open?id=0Bzbi5rbfN85Nb292azZxRmU0R1U) : [解説記事](http://yaneuraou.yaneu.com/2017/06/26/%E3%80%8Eshivoray%E3%80%8F%E5%85%A8%E8%87%AA%E5%8B%95%E9%9B%91%E5%B7%BE%E7%B5%9E%E3%82%8A%E6%A9%9F%E5%85%AC%E9%96%8B%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F/)
