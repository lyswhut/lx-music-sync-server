# lx-music-script change log

All notable changes to this project will be documented in this file.

Project versioning adheres to [Semantic Versioning](http://semver.org/).
Commit convention is based on [Conventional Commits](http://conventionalcommits.org).
Change log format is based on [Keep a Changelog](http://keepachangelog.com/).

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
