# LX Msuic Sync Server

洛雪音乐数据同步服务端，本项目目前用于收藏列表数据同步，类似原来PC端的数据同步服务，只不过它现在是一个独立版的服务，可以将其部署到服务器上使用。

本项目需要有一些服务器操作经验的人使用，若遇到问题欢迎反馈。

**由于服务本身不提供https协议支持，若将服务部署在公网，请务必使用Nginx之类的服务做反向代理（SSL证书需可信且[证书链完整](https://stackoverflow.com/a/60020493)），实现客户端到服务器之间的https连接。**


## 环境要求

- Node.js 16+

## 使用方法

### 安装node.js

Cent OS可以运行以下命令安装：

```bash
sudo yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash  -
sudo yum install nodejs -y
```

基于 Debian、Ubuntu 发行版的系统使用以下命令安装：

```bash
sudo apt-get install -y build-essential
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
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

注：若安装失败，则可能需要以管理员权限安装

若没有安装PM2，则后面`pm2`开头的命令都可以跳过

### 安装依赖

若安装依赖过程中出现因`utf-8-validate`包编译失败的错误，请尝试搜索相关错误解决，若实在无法解决，则可以编辑`package.json`文件删除`dependencies`下的`utf-8-validate`后，重新运行`npm ci --omit=dev`或`npm ci`即可


如果你是在release下载的压缩包，则解压后项目目录执行以下命令安装依赖：

```bash
npm ci --omit=dev
```


如果你是直接下载的源码，则在本目录中运行以下命令

```bash
npm ci
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

#### 说明

代理需要配置两条规则：

1. 代理链接 URL 根路径下所有子路径的 **WebSocket** 请求到 LX Sync 服务
2. 代理链接 URL 根路径下所有子路径的 **HTTP** 请求到 LX Sync 服务

#### 配置

编辑Nginx配置文件，在server下添加代理规则，如果你当前server块下只打算配置 LX Sync 服务，那么可以使用以下配置：

```conf
map $http_upgrade $connection_upgrade{
    default upgrade;
    '' close;
}
server {
    # ...
    location / {
        proxy_set_header X-Real-IP $remote_addr;  # 该头部与config.js文件的 proxy.header 对应
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host  $http_host;
        proxy_pass http://127.0.0.1:9527;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
```

如果你当前server块下存在其他服务，那么可以配置路径前缀转发：

```conf
map $http_upgrade $connection_upgrade{
    default upgrade;
    '' close;
}
server {
    # ...
    location /xxx/ {
        proxy_set_header X-Real-IP $remote_addr;  # 该头部与config.js文件的 proxy.header 对应
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host  $http_host;
        proxy_pass http://127.0.0.1:9527;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
```

注：上面的`xxx`是你想要代理的路径前缀（可以多级）

注意`$remote_addr`的转发名字与config.js中的`proxy.header`对应并同时启用`proxy.enabled`（或与环境变量的`PROXY_HEADER`对应），这用于校验相同IP多次使用错误连接码连接时的封禁

## 升级新版本

若更新日志无特别说明，注意保留**你修改过**的 `config.js`、`ecosystem.config.js` 或 `Dockerfile` 之类的配置文件，以及`data`、`logs`目录即可，其他的都可以删除后再将新版本的文件复制进去，以下是更新日志无特别说明的更新流程：

使用在release下载的压缩包运行的服务：

1. 删除项目目录下的 `server`、`node_modules` 目录以及 `index.js`、`package.json`、`package-lock.json` 文件
2. 将新版本的`server`目录 `index.js`、`package.json`、`package-lock.json` 文件复制进去
3. 执行`npm ci --omit=dev`
4. 重启服务，执行 `pm2 restart 服务名称或ID` 重启服务（可以先执行`pm2 list`查看服务id或名称）

使用源码编译运行的服务：

1. 重新下载源码或使用git将代码更新到最新版本
2. 执行 `npm ci` 与 `npm run build`
3. 重启你的服务

使用docker：将代码更新到最新后，再打包镜像即可

## 从快照文件恢复数据

方式1：

使用快照文件转换工具将其转换成列表备份文件后再导入备份： https://lyswhut.github.io/lx-msuic-sync-snapshot-transform/

方式2：

1. 停止同步服务
2. 修改`data/users/<用户名>/list/snapshotInfo.json`里面的`latest`为你那个备份文件key名（即`snapshot`文件夹下去掉`snapshot_`前缀后的名字）
3. 删除`snapshotInfo.json`文件内`clients`内的所有设备信息，删除后的内容类似：`{...其他内容,"clients":{}}`
4. 启用同步服务，连接后勾选“完全覆盖”，选择“远程覆盖本地”

## 附录

### 可用的环境变量

| 变量名称 | 说明
|:---:| ---
| `PORT` | 绑定的端口号，默认`9527`
| `BIND_IP` | 绑定的IP地址，默认`127.0.0.1`，使用`0.0.0.0`将接受所有IPv4请求，使用`::`将接受所有IP请求
| `PROXY_HEADER` | 代理转发的请求头 原始IP，如果设置，则自动启用
| `CONFIG_PATH` | 配置文件路径，默认使用项目目录下的`config.js`
| `LOG_PATH` | 服务日志保存路径，默认保存在服务目录下的`logs`文件夹内
| `DATA_PATH` | 同步数据保存路径，默认保存在服务目录下的`data`文件夹内
| `MAX_SNAPSHOT_NUM` | 公共最大备份快照数
| `SERVER_NAME` | 同步服务名称
| `LIST_ADD_MUSIC_LOCATION_TYPE` | 公共添加歌曲到我的列表时的方式可用值为 `top`、`bottom`
| `LX_USER_` | 以`LX_USER_`开头的环境变量将被识别为用户配置，可用的配置语法为：<br />1. `LX_USER_user1='xxx'`<br />2. `LX_USER_user1='{"password":"xxx"}'`<br />其中`LX_USER_`会被去掉，剩下的`user1`为用户名，`xxx`为用户密码（**链接码**），<br />配置方式1为简写模式，只指定用户名及密码（链接码），其他配置使用公共配置，<br />配置方式2为JSON字符串格式，配置内容参考`config.js`，由于该方式在变量名指定了用户名，所以JSON里的用户名是可选的

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

或者使用已发布到 Docker Hub 的镜像：<https://hub.docker.com/r/lyswhut/lx-music-sync-server>

也可以看issue中的解决方案：<https://github.com/lyswhut/lx-music-sync-server/issues/4>
