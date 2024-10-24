# Unicornテスト用サーバー

フロントエンド実装で利用する機能のテストを行うためのリポジトリです。
Dockerコンテナで機能を分割して利用します。

## CloudMessaging

Firebase Cloud Messegingを利用して、フロントエンドにプッシュ通知を提供するサーバーです。

### コンテナスペック

- Node.js v18.20.3
- TypeScript v5.6.3
- Express.js v4.21.1

### API仕様 

最終更新: 2024/10/24

#### [POST] /send

**Explain**

指定FCMTokenを持つ単体デバイスにメッセージを送信します。

**Parameters**

body
```
token: <String> デバイスから発行されるFCMToken
title: <String> 通知タイトル
body:  <String> 通知本文
```

**Response**

**200** : Success

**400** : Invalid token (トークン未設定)

**500** : Internal Server Error

---

#### [POST] /multicast

**Explain**

指定FCMTokenを持つ複数デバイスにメッセージを送信します。

**Parameters**

body
```
tokens: <String[]> デバイスから発行されるFCMToken配列
title:  <String>   通知タイトル
body:   <String>   通知本文
```

**Response**

**200** : Success

**400** : Invalid tokens (トークン未設定)

**500** : Internal Server Error

---

#### [POST] /topic

**Explain**

指定トピックを購読しているすべてのデバイスにメッセージを送信します。

**Parameters**

body
```
topic: <String> トピック名
title: <String> 通知タイトル
body:  <String> 通知本文
```

**Response**

**200** : Success

**400** : Invalid topic (未定義のトピック)

**500** : Internal Server Error

---

#### [POST] /subscribe

**Explain**

指定FCMTokenを持つデバイスに指定トピックを購読します。

**Parameters**

body
```
tokens: <String[]> デバイスから発行されるFCMToken配列
topic:  <String>   トピック名
```

**Response**

**200** : Success

**400** : Invalid topic (未定義のトピック)

**500** : Internal Server Error

---

#### [GET] /subscribe/topic

**Explain**

購読可能なトピックの配列を取得します。

**Response**

**200** : Success

**404** : No topics found (トピック購読不可)

**500** : Internal Server Error