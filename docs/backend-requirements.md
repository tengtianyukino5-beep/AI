# 后端开发需求文档

## 1. 项目定位

后端为情侣陪伴类 Web App 提供账号、关系绑定、每日打卡、心情日记、共同目标、消息、日历回顾、通知与数据导出能力。

产品核心是“双人关系”：

- 一个用户只能处于一个当前有效关系中。
- 一个关系最多绑定两名用户。
- 每天每人最多提交一次打卡记录。
- 首页、日历、目标、消息均围绕当前关系聚合数据。

## 2. 业务模块

后端首期包含以下模块：

1. 用户与认证
2. 验证码登录
3. 双人关系与邀请码
4. 首页概览
5. 每日打卡与心情日记
6. 共同目标与金额记录
7. 消息/今日一言
8. 日历聚合
9. 我的页面与设置
10. 通知
11. 数据导出
12. 后台管理与审计日志，可第二期实现

## 3. 推荐技术栈

可选方案一：

- Node.js + NestJS
- PostgreSQL
- Prisma ORM
- Redis
- JWT + Refresh Token
- BullMQ/队列任务
- 对象存储，可第二期加入

可选方案二：

- Java + Spring Boot
- PostgreSQL
- Redis
- MyBatis/JPA
- JWT + Refresh Token

如果团队偏前端全栈，推荐 Node.js + NestJS + Prisma，便于快速迭代接口和类型。

## 4. 认证与账号

### 4.1 登录方式

首期使用邮箱验证码登录。

流程：

1. 用户输入邮箱。
2. 后端发送 6 位验证码。
3. 用户提交邮箱、验证码、可选邀请码。
4. 验证成功后创建或登录用户。
5. 如果传入邀请码，则尝试加入关系。
6. 返回 access token、refresh token、用户信息和当前关系状态。

### 4.2 安全要求

- 验证码 6 位数字。
- 验证码有效期 5-10 分钟。
- 同一邮箱发送间隔不低于 60 秒。
- 同一 IP 需要限流。
- 验证码错误次数超过阈值后短暂锁定。
- access token 建议 15-30 分钟有效。
- refresh token 建议 7-30 天有效，并支持失效。

## 5. 核心数据模型

以下为建议数据表，字段命名可根据团队规范调整。

### 5.1 users

用户表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid | 用户 ID |
| email | varchar | 邮箱，唯一 |
| nickname | varchar | 昵称 |
| avatar_url | varchar | 头像 |
| status | enum | active/disabled/deleted |
| timezone | varchar | 用户时区 |
| locale | varchar | 语言 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 5.2 auth_codes

验证码表或 Redis 缓存。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid | 记录 ID |
| email | varchar | 邮箱 |
| code_hash | varchar | 验证码哈希 |
| purpose | enum | login |
| expires_at | timestamp | 过期时间 |
| consumed_at | timestamp | 使用时间 |
| failed_count | int | 失败次数 |
| created_at | timestamp | 创建时间 |

验证码明文不应入库。

### 5.3 relationships

情侣关系表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid | 关系 ID |
| invite_code | varchar | 邀请码，唯一 |
| status | enum | pending/active/broken |
| started_on | date | 关系开始日期 |
| created_by | uuid | 创建人 |
| broken_at | timestamp | 解除时间 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 5.4 relationship_members

关系成员表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid | 记录 ID |
| relationship_id | uuid | 关系 ID |
| user_id | uuid | 用户 ID |
| role | enum | owner/member |
| joined_at | timestamp | 加入时间 |
| left_at | timestamp | 离开时间 |

唯一约束：

- 一个 active/pending 关系最多两个 active member。
- 同一用户同一时间只能有一个 active relationship。

### 5.5 daily_checkins

每日打卡/心情日记表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid | 记录 ID |
| relationship_id | uuid | 关系 ID |
| user_id | uuid | 用户 ID |
| checkin_date | date | 打卡日期，按用户时区归属 |
| mood | enum | happy/normal/sad |
| note | varchar(200) | 日记内容 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

唯一约束：

- `(relationship_id, user_id, checkin_date)` 唯一。

### 5.6 goals

共同目标表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid | 目标 ID |
| relationship_id | uuid | 关系 ID |
| title | varchar | 目标名称 |
| target_amount | bigint | 目标金额，最小货币单位 |
| current_amount | bigint | 当前金额，冗余字段 |
| currency | varchar | 币种，例如 JPY/CNY |
| status | enum | active/completed/archived |
| cover_type | varchar | 封面/插画类型 |
| completed_at | timestamp | 完成时间 |
| created_by | uuid | 创建人 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 5.7 goal_entries

目标金额流水表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid | 流水 ID |
| goal_id | uuid | 目标 ID |
| relationship_id | uuid | 关系 ID |
| user_id | uuid | 操作人 |
| amount_delta | bigint | 金额变化，最小货币单位 |
| note | varchar | 备注 |
| entry_date | date | 记录日期 |
| created_at | timestamp | 创建时间 |

要求：

- 添加流水必须事务内更新 `goals.current_amount`。
- 金额达到目标后将目标状态改为 `completed` 并写入 `completed_at`。

### 5.8 messages

消息/今日一言表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid | 消息 ID |
| relationship_id | uuid | 关系 ID |
| sender_id | uuid | 发送人 |
| message_date | date | 所属日期 |
| content | varchar(500) | 内容 |
| type | enum | daily_word/reply/system |
| created_at | timestamp | 创建时间 |
| deleted_at | timestamp | 删除时间 |

### 5.9 user_settings

用户设置表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| user_id | uuid | 用户 ID |
| notification_enabled | boolean | 是否开启通知 |
| daily_reminder_time | varchar | 每日提醒时间，例如 20:30 |
| privacy_level | enum | default/private |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 5.10 notification_tokens

推送设备表，可第二期接入。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uuid | 记录 ID |
| user_id | uuid | 用户 ID |
| provider | enum | web_push/apns/fcm |
| token | text | 推送 token |
| user_agent | text | 设备信息 |
| created_at | timestamp | 创建时间 |
| revoked_at | timestamp | 失效时间 |

## 6. API 设计

接口统一前缀建议：`/api/v1`。

统一响应格式：

```json
{
  "data": {},
  "error": null,
  "requestId": "req_xxx"
}
```

错误响应：

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  },
  "requestId": "req_xxx"
}
```

### 6.1 认证接口

#### POST `/auth/send-code`

发送邮箱验证码。

请求：

```json
{
  "email": "user@example.com"
}
```

响应：

```json
{
  "cooldownSeconds": 60
}
```

#### POST `/auth/login`

验证码登录。

请求：

```json
{
  "email": "user@example.com",
  "code": "123456",
  "inviteCode": "A8X2K"
}
```

响应：

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "ゆうた",
    "avatarUrl": ""
  },
  "relationship": {
    "id": "uuid",
    "status": "active"
  }
}
```

#### POST `/auth/refresh`

刷新 token。

#### POST `/auth/logout`

退出登录并失效 refresh token。

### 6.2 用户接口

#### GET `/me`

获取当前用户信息、设置和关系摘要。

#### PATCH `/me`

更新昵称、头像、语言、时区。

请求：

```json
{
  "nickname": "さくら",
  "avatarUrl": "https://example.com/avatar.png",
  "timezone": "Asia/Tokyo",
  "locale": "ja-JP"
}
```

### 6.3 关系接口

#### POST `/relationships`

创建关系并生成邀请码。

请求：

```json
{
  "startedOn": "2024-05-01"
}
```

响应：

```json
{
  "id": "uuid",
  "inviteCode": "A8X2K",
  "status": "pending",
  "startedOn": "2024-05-01"
}
```

#### POST `/relationships/join`

通过邀请码加入关系。

请求：

```json
{
  "inviteCode": "A8X2K"
}
```

#### GET `/relationships/current`

获取当前关系、成员、邀请码、关系天数。

#### POST `/relationships/current/break`

解除当前关系。

要求：

- 需要二次确认参数，例如 `confirm: true`。
- 解除后关系状态变为 `broken`。
- 历史数据保留，不在普通接口继续展示为当前关系。

### 6.4 首页接口

#### GET `/dashboard`

获取首页聚合信息。

响应：

```json
{
  "relationship": {
    "id": "uuid",
    "coupleName": "ゆうた & さくら",
    "daysTogether": 12,
    "status": "active"
  },
  "members": [
    {
      "userId": "uuid",
      "nickname": "ゆうた",
      "avatarUrl": "",
      "isMe": true
    }
  ],
  "streak": {
    "currentDays": 5,
    "todayCompletedByMe": true,
    "todayCompletedByPartner": false
  },
  "partnerToday": {
    "mood": "happy",
    "note": "今日もおつかれさま！",
    "checkedInAt": "2024-05-20T11:30:00Z"
  },
  "goal": {
    "id": "uuid",
    "title": "一緒に10万円貯める",
    "currentAmount": 7000000,
    "targetAmount": 10000000,
    "currency": "JPY",
    "progress": 0.7
  }
}
```

说明：

- `currentAmount` 和 `targetAmount` 使用最小货币单位，例如日元可直接使用整数，人民币建议分。
- `streak.currentDays` 是双方共同连续完成天数，具体规则见第 8 节。

### 6.5 打卡与心情接口

#### POST `/checkins/today`

提交或更新今日打卡。

请求：

```json
{
  "mood": "happy",
  "note": "今日も一緒に頑張れそう！"
}
```

响应：

```json
{
  "id": "uuid",
  "checkinDate": "2024-05-20",
  "mood": "happy",
  "note": "今日も一緒に頑張れそう！",
  "bothCompleted": false,
  "streakDays": 5
}
```

#### GET `/checkins/today`

获取今日双方打卡状态。

#### GET `/checkins/timeline`

获取时间线。

查询参数：

- `cursor`
- `limit`
- `from`
- `to`

#### GET `/checkins/:date`

获取指定日期双方记录。

### 6.6 日历接口

#### GET `/calendar`

按月获取日历聚合数据。

查询参数：

- `month=2024-05`

响应：

```json
{
  "month": "2024-05",
  "days": [
    {
      "date": "2024-05-01",
      "status": "both",
      "me": {
        "checkedIn": true,
        "mood": "happy"
      },
      "partner": {
        "checkedIn": true,
        "mood": "normal"
      }
    }
  ]
}
```

`status` 枚举：

- `both`
- `me_only`
- `partner_only`
- `none`
- `future`

### 6.7 目标接口

#### GET `/goals/current`

获取当前 active 目标。

#### POST `/goals`

创建目标。

请求：

```json
{
  "title": "一緒に10万円貯める",
  "targetAmount": 10000000,
  "currency": "JPY",
  "coverType": "couple"
}
```

#### PATCH `/goals/:goalId`

编辑目标。

#### POST `/goals/:goalId/entries`

添加金额流水。

请求：

```json
{
  "amountDelta": 200000,
  "note": "5/20 貯金",
  "entryDate": "2024-05-20"
}
```

响应：

```json
{
  "entry": {
    "id": "uuid",
    "amountDelta": 200000,
    "createdAt": "2024-05-20T10:00:00Z"
  },
  "goal": {
    "id": "uuid",
    "currentAmount": 7200000,
    "targetAmount": 10000000,
    "status": "active",
    "progress": 0.72
  }
}
```

#### GET `/goals/:goalId/entries`

获取目标流水列表。

### 6.8 消息接口

#### GET `/messages`

获取消息列表。

查询参数：

- `date=2024-05-20`
- `cursor`
- `limit`

#### POST `/messages`

发送消息。

请求：

```json
{
  "content": "こちらこそありがとう！",
  "type": "reply",
  "messageDate": "2024-05-20"
}
```

#### DELETE `/messages/:messageId`

删除自己发送的消息。

### 6.9 设置接口

#### GET `/settings`

获取用户设置。

#### PATCH `/settings`

更新用户设置。

请求：

```json
{
  "notificationEnabled": true,
  "dailyReminderTime": "20:30",
  "privacyLevel": "default"
}
```

### 6.10 数据导出接口

#### POST `/exports`

创建数据导出任务。

响应：

```json
{
  "exportId": "uuid",
  "status": "pending"
}
```

#### GET `/exports/:exportId`

查询导出任务状态。

响应：

```json
{
  "exportId": "uuid",
  "status": "completed",
  "downloadUrl": "https://example.com/export.zip",
  "expiresAt": "2024-05-27T00:00:00Z"
}
```

## 7. 权限规则

通用规则：

- 用户只能访问自己的当前关系数据。
- 关系数据必须校验 `relationship_members`。
- 消息只能由发送者删除。
- 当前关系解除后，不允许继续写入打卡、目标、消息。
- 加入邀请码时，如果关系已有两个有效成员，应返回业务错误。
- 如果用户已有有效关系，不允许加入另一个有效关系，除非先解除。

## 8. 业务规则

### 8.1 关系天数

关系天数计算：

```text
daysTogether = today - startedOn + 1
```

要求：

- 按关系设置或用户时区计算 `today`。
- `startedOn` 不可晚于今天。

### 8.2 连续打卡天数

建议定义为“双方都完成打卡”的连续天数。

计算规则：

1. 从今天开始向前检查。
2. 如果今天双方都完成，则今天计入。
3. 如果今天只有一方完成，可根据产品策略显示昨天为止的连续天数，并额外返回今日状态。
4. 遇到任一天不是双方完成则停止。

后端可以返回：

```json
{
  "currentDays": 5,
  "todayCompletedByMe": true,
  "todayCompletedByPartner": false,
  "lastBothCompletedDate": "2024-05-19"
}
```

### 8.3 每日打卡限制

- 每个用户每天最多一条有效打卡。
- 是否允许编辑当天打卡由产品决定，建议首期允许当天内覆盖更新。
- 不能补未来日期。
- 是否允许补签历史日期可第二期再做。

### 8.4 目标金额

- 金额存储使用整数，避免浮点误差。
- 添加流水时必须使用数据库事务。
- `current_amount` 不得小于 0。
- 达成目标后仍可查看历史，不建议继续添加金额，除非产品允许超额。

### 8.5 消息

- 每条消息最大 500 字。
- 今日一言可视为 `daily_word` 类型消息。
- 普通回复为 `reply`。
- 删除采用软删除。

## 9. 错误码建议

| 错误码 | HTTP 状态 | 说明 |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | 未登录或 token 失效 |
| `FORBIDDEN` | 403 | 无权限访问资源 |
| `VALIDATION_ERROR` | 400 | 参数校验失败 |
| `AUTH_CODE_EXPIRED` | 400 | 验证码过期 |
| `AUTH_CODE_INVALID` | 400 | 验证码错误 |
| `RATE_LIMITED` | 429 | 请求过于频繁 |
| `INVITE_CODE_INVALID` | 400 | 邀请码无效 |
| `RELATIONSHIP_FULL` | 409 | 关系成员已满 |
| `ALREADY_IN_RELATIONSHIP` | 409 | 用户已有关系 |
| `CHECKIN_ALREADY_EXISTS` | 409 | 当天已打卡且不允许更新 |
| `GOAL_NOT_FOUND` | 404 | 目标不存在 |
| `RELATIONSHIP_INACTIVE` | 409 | 当前关系不可写入 |

## 10. 通知需求

首期可先保留接口，第二期接入 Web Push 或移动端推送。

通知场景：

- 对方完成今日打卡。
- 对方发送今日一言。
- 每日固定时间提醒未打卡。
- 目标达成提醒。
- 邀请码被使用，关系绑定成功。

后端要求：

- 用户可关闭通知。
- 通知任务需要避免重复发送。
- 定时提醒按用户时区触发。

## 11. 数据导出

导出内容：

- 用户资料。
- 关系信息。
- 每日打卡记录。
- 心情日记。
- 消息记录。
- 目标与金额流水。

导出格式：

- 首期 JSON 或 CSV。
- 第二期可支持 PDF 回忆册。

安全要求：

- 导出链接需要短期有效。
- 用户只能导出自己当前或历史关系中自己有权限的数据。
- 导出任务完成后可发送站内通知或邮件。

## 12. 性能要求

首期目标：

- 首页接口 P95 小于 500ms。
- 日历接口 P95 小于 800ms。
- 时间线分页默认 20 条。
- 主要列表必须分页或按月查询。
- 常用聚合可用 Redis 缓存，但数据一致性优先。

索引建议：

- `users.email`
- `relationships.invite_code`
- `relationship_members.user_id`
- `relationship_members.relationship_id`
- `daily_checkins.relationship_id, checkin_date`
- `daily_checkins.relationship_id, user_id, checkin_date`
- `goals.relationship_id, status`
- `goal_entries.goal_id, created_at`
- `messages.relationship_id, message_date, created_at`

## 13. 日志与监控

必须记录：

- 登录成功/失败。
- 验证码发送频率。
- 加入/解除关系。
- 打卡提交。
- 目标金额变更。
- 数据导出。

日志要求：

- 不记录验证码明文。
- 不在日志中输出完整 token。
- 对用户输入内容做长度限制和敏感信息保护。

监控指标：

- 登录失败率。
- 验证码发送量。
- 打卡提交量。
- 接口错误率。
- 慢查询。
- 队列任务失败率。

## 14. 后台管理需求

第二期可做简单管理后台：

- 用户查询。
- 关系查询。
- 违规内容处理。
- 数据导出审计。
- 系统配置。
- 通知模板管理。

后台必须有独立管理员权限体系和操作审计。

## 15. 测试要求

单元测试：

- 验证码生成和校验。
- 邀请码加入规则。
- 连续打卡天数计算。
- 目标金额流水和达成判断。
- 权限校验。

集成测试：

- 登录流程。
- 创建关系和加入关系。
- 提交打卡后首页状态变化。
- 目标添加金额后进度变化。
- 日历月数据聚合。
- 消息发送与查询。

安全测试：

- 越权访问他人关系数据。
- 重复使用验证码。
- 邀请码暴力尝试限流。
- 高频发送消息限流。

## 16. 首期验收标准

后端首期验收条件：

- 邮箱验证码登录可用。
- 用户可创建关系并生成邀请码。
- 第二位用户可通过邀请码加入关系。
- 首页接口能返回关系天数、成员、今日状态、连续打卡、当前目标。
- 用户可提交今日心情日记。
- 日历接口能返回某月每日双方打卡状态。
- 用户可创建目标、添加金额、获取历史流水。
- 目标达成时返回 completed 状态。
- 用户可发送和查看消息。
- 我的页面可获取邀请码、设置和关系状态。
- 所有关系相关接口都有成员权限校验。
- 基础错误码和限流策略可用。

## 17. 可延期功能

以下功能不建议放入首期：

- 多段关系历史切换。
- 多目标并行。
- 图片/语音/视频消息。
- AI 情绪分析。
- 复杂成就系统。
- PDF 回忆册导出。
- 管理后台全量能力。
- 原生 App 推送。
