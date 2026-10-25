FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv tesseract-ocr ca-certificates && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/kairo-python && /opt/kairo-python/bin/pip install --no-cache-dir 'pypdf>=6,<7' 'python-docx>=1.2,<2' 'python-pptx>=1,<2' 'openpyxl>=3.1.5,<4' 'pypdfium2>=5,<6' 'Pillow>=12,<13' 'pytesseract>=0.3.13,<0.4'
WORKDIR /app/studio
COPY studio/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY studio/server ./server
COPY studio/src ./src
COPY studio/data ./data
COPY studio/dist ./dist
COPY tools /app/tools
RUN /opt/kairo-python/bin/pip freeze > /app/python-requirements-resolved.txt
ENV NODE_ENV=production KAIRO_PYTHON=/opt/kairo-python/bin/python3
USER node
CMD ["node","server/learner-entry.mjs"]
