FROM node:20-bookworm-slim

# Cài đặt Chromium, fonts tiếng Nhật/Á Đông và dumb-init để quản lý tiến trình Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    dumb-init \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Cấu hình biến môi trường cho Puppeteer và Cloud Run
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=8080

WORKDIR /app

# Cài đặt dependencies từ thư mục server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Sao chép mã nguồn backend
COPY server/ .

# Đảm bảo thư mục lưu trữ dữ liệu tồn tại
RUN mkdir -p /app/data

# Cloud Run mặc định định tuyến tới cổng 8080
EXPOSE 8080

# dumb-init xử lý việc truyền tín hiệu SIGTERM/SIGINT và dọn dẹp zombie process của Chromium
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
