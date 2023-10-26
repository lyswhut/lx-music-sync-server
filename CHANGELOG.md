# lx-music-script change log

All notable changes to this project will be documented in this file.

Project versioning adheres to [Semantic Versioning](http://semver.org/).
Commit convention is based on [Conventional Commits](http://conventionalcommits.org).
Change log format is based on [Keep a Changelog](http://keepachangelog.com/).

## [2.1.2](https://github.com/lyswhut/lx-music-sync-server/compare/v2.1.1...v2.1.2) - 2023-10-26

### 修复

- 修复绑定IP为IPv6时，连接用户时会导致服务报错的问题（#55）

## [2.1.1](https://github.com/lyswhut/lx-music-sync-server/compare/v2.1.0...v2.1.1) - 2023-10-03

### 优化

- 在控制台显示所有创建的用户名及密码

## [2.1.0](https://github.com/lyswhut/lx-music-sync-server/compare/v2.0.3...v2.1.0) - 2023-09-14

### 新增

- 添加armv7l docker 镜像构建

## [2.0.3](https://github.com/lyswhut/lx-music-sync-server/compare/v2.0.2...v2.0.3) - 2023-09-12

### 修复

- 修复两边设备的数据为空时快照没有被创建的问题

## [2.0.2](https://github.com/lyswhut/lx-music-sync-server/compare/v2.0.1...v2.0.2) - 2023-09-10

### 修复

- 修复同步数据字段顺序不一致导致两边列表数据相同时会出现MD5不匹配进而导致多余的同步流程问题

## [2.0.1](https://github.com/lyswhut/lx-music-sync-server/compare/v2.0.0...v2.0.1) - 2023-09-10

### 修复

- v1 -> v2的数据迁移时跳过对空数据的用户文件夹处理

## [2.0.0](https://github.com/lyswhut/lx-music-sync-server/compare/v1.3.1...v2.0.0) - 2023-09-09

### 不兼容性变更

该版本修改了同步协议逻辑，同步功能至少需要PC端v2.4.0或移动端v1.1.0或同步服务v2.0.0版本才能连接使用
这个版本涉及 data 文件夹内的数据迁移，首次运行该版本时会自动将旧版本数据迁移到新版本，数据迁移完毕后不要再降级到v2.0.0之前的版本，否则会出现意料之外的问题，所以在升级前建议备份一下 data 目录

### 新增

- 新增自动压缩数据机制，要传输的数据过大时自动压缩数据以减少传输流量
- 新增对“不喜欢歌曲”列表的同步

### 优化

- 添加重复的客户端连接检测
- 为socket连接添加IP阻止名单校验
- 优化数据传输逻辑，列表同步指令使用队列机制，保证列表同步操作的顺序
- 重构代码，使其易于后续功能扩展

### 修复

- 修复潜在导致列表数据不同步的问题
- 修复密码长度缺陷问题

### 变更

socket的连接地址从原来的 `/` 改为 `/socket`，这意味着不用再像之前那样配置两条规则，可以使用类似以下的方式合并配置：

```conf
location /xxx/ {
    proxy_set_header X-Real-IP $remote_addr;  # 该头部与config.js文件的 proxy.header 对应
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host  $http_host;
    proxy_pass http://127.0.0.1:9527;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
}
```

## [1.3.1](https://github.com/lyswhut/lx-music-sync-server/compare/v1.3.0...v1.3.1) - 2023-03-31

### 优化

- 添加重复的客户端连接检测
- 为socket连接添加IP阻止名单校验

### 修复

- 修复潜在导致列表数据不同步的问题

## [1.3.0](https://github.com/lyswhut/lx-music-sync-server/compare/v1.2.3...v1.3.0) - 2023-03-27

### 新增

- 新增从配置文件读取环境变量的功能，在配置文件中，所有以`env.`开头的配置将视为环境变量配置，例如想要在配置文件中指定端口号，可以添加`'env.PORT': '9527'`

## [1.2.3](https://github.com/lyswhut/lx-music-sync-server/compare/v1.2.2...v1.2.3) - 2023-03-27

### 优化

- 添加用户空间管理延迟销毁

### 修复

- 修复在环境变量使用简写方式创建用户的数据解析问题（#6）

## [1.2.2](https://github.com/lyswhut/lx-music-sync-server/compare/v1.2.1...v1.2.2) - 2023-03-26

### 修复

- 修复默认绑定IP被意外绑定到`0.0.0.0`的问题

## [1.2.1](https://github.com/lyswhut/lx-music-sync-server/compare/v1.2.0...v1.2.1) - 2023-03-17

### 其他

- 移除多余的日志输出

## [1.2.0](https://github.com/lyswhut/lx-music-sync-server/compare/v1.1.0...v1.2.0) - 2023-03-16

该版本配置文件数据结构已更改，更新时请注意更新配置文件

### 优化

- 修改配置文件数据结构

## [1.1.0](https://github.com/lyswhut/lx-music-sync-server/compare/v1.0.0...v1.1.0) - 2023-03-16

该版本配置文件格式已更改，更新时请注意更新配置文件

### 新增

- 新增多用户支持
- 允许使用环境变量配置更多设置项

## 1.0.0 - 2023-03-10

v1.0.0发布~
