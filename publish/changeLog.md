### 不兼容性变更

该版本修改了同步协议逻辑，同步功能至少需要PC端v2.4.0或移动端v1.1.0或同步服务v2.0.0版本才能连接使用

### 新增

- 新增自动压缩数据机制，要传输的数据过大时自动压缩数据以减少传输流量

### 优化

- 添加重复的客户端连接检测
- 为socket连接添加IP阻止名单校验
- 优化数据传输逻辑，列表同步指令使用队列机制，保证列表同步操作的顺序

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
