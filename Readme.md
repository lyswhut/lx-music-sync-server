# LX Msuic Sync Server

洛雪音乐数据同步服务端，本项目目前用于收藏列表数据同步，类似原来PC端的数据同步服务，只不过它现在是一个独立版的服务，可以将其部署到服务器上使用。

本项目需要有一些服务器操作经验的人使用，若遇到问题欢迎反馈。

**
由于服务本身不提供https协议支持，若将服务部署在公网，请务必使用Nginx之类的服务做反向代理，实现客户端到服务器之间的https连接。**

## 环境要求

- Node.js 16+

## 使用方法

### 安装node.js

Cent OS可以运行以下命令安装：

```bash
yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash  -
sudo yum install nodejs -y
```

安装完毕后输入以下命令正常情况下会显示Node.js的版本号

```bash
node -v
```

### 安装PM2（非必须）

PM2是一个Node.js服务管理工具，可以在服务崩溃时自动重启，更多使用方式请自行百度

```bash
npm i -g pm2
```

若没有安装PM2，则后面`pm2`开头的命令都可以跳过

### 安装依赖

若安装依赖过程中出现因`utf-8-validate`包编译失败的错误，请尝试搜索相关错误解决，若实在无法解决，则可以编辑`package.json`
文件删除`dependencies`下的`utf-8-validate`后，重新运行`npm install --omit=dev`或`npm install`即可

如果你是在release下载的压缩包，则解压后项目目录执行以下命令安装依赖：

```bash
npm install --omit=dev
```

如果你是直接下载的源码，则在本目录中运行以下命令

```bash
npm install
npm run build
```

### 配置config.js

按照文件中的说明配置好本目录下的`config.js`文件

### 配置ecosystem.config.js中的env_production

可以在这里配置PM2的启动配置，具体根据你的需求配置

### 启动服务器

```bash
npm run prd
```

若你没有安装PM2，则可以用`npm start`启动

### 查看启动日志

```bash
pm2 logs
```

若无报错相关的日志，则说明服务启动成功

### 设置服务开机启动

**注意：** 该命令对Windows系统无效，Windows需用批处理的方式设置

```bash
pm2 save
pm2 startup
```

到这里服务已搭建完成，但是为了你的数据安全，我们**强烈建议**使用Nginx之类的服务为同步服务添加 TLS 保护！

### 配置Nginx

<!-- 看官网安装文档完成：<https://www.nginx.com/resources/wiki/start/topics/tutorials/install/> -->

编辑Nginx配置文件，在server下添加 LX Sync 的代理规则：

```conf
location /xxx/ { # 该规则用于代理路径下的http请求
    proxy_set_header X-Real-IP $remote_addr;  # 该头部与config.ts文件的 proxy.header 对应
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host  $http_host;
    proxy_set_header Connection "";
    proxy_set_header X-Nginx-Proxy true;
    proxy_pass http://127.0.0.1:9527;
    proxy_redirect default;
}
location /xxx { # 该规则用于代理路径下的ws请求
    proxy_set_header X-Real-IP $remote_addr; # 该头部与config.ts文件的 proxy.header 对应
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host  $http_host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header X-Nginx-Proxy true;
    proxy_pass http://127.0.0.1:9527;
    proxy_redirect default;
}
```

注：上面的`xxx`是你想要代理的路径（可以多级），注意`$remote_addr`的转发名字与config.ts中的`proxy.header`
对应，同时启用`proxy.enabled`，这用于校验相同IP多次使用错误连接码连接时的封禁

## 附录

### 可用的环境变量

|            变量名称             | 说明
|:---------------------------:| ---
|           `PORT`            | 绑定的端口号，默认`9527`
|          `BIND_IP`          | 绑定的IP地址，默认`0.0.0.0`，接受所有IP请求
|         `LOG_PATH`          | 服务日志保存路径，默认保存在服务目录下的`logs`文件夹内
|         `DATA_PATH`         | 同步数据保存路径，默认保存在服务目录下的`data`文件夹内
|  `CLEAR_DELETE_USER_DATA`   | 清理已删除用户的相关数据，默认false不清理
|     `DEFAULT_USER_NAME`     | 默认配置用户名,默认 mySyncServer
|    `DEFAULT_CONNECT_PWD`    | 默认配置连接密码，若在外网，务必增加密码复杂度
| `DEFAULT_MAXS_SNAPSHOT_NUM` | 默认配置最大备份快照数，默认10
|        `CONFIG_PATH`        | 配置文件路径，默认使用项目目录下的`config.js`，修改配置增加用户后默认用户失效

### PM2常用命令

- 查看服务列表：`pm2 list`
- 服务控制台的输出日志：`pm2 logs`
- 重启服务：`pm2 restart` 服务名称/编号
- 停止服务：`pm2 stop` 服务名称/编号

### Docker

可以使用以下方式构建docker镜像（Dockerfile用的是源码构建）：

```bash
docker build -t lx-music-sync-server .
```
