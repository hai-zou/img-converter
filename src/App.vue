<template>
  <div class="container">
    <el-upload
      v-model:file-list="fileList"
      :show-file-list="false"
      action=""
      multiple
      :auto-upload="false"
      :on-change="handleFileChange"
      drag
    >
      <el-icon :size="50"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将文件拖到此处，或<em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          图片大小不能超过4MB
        </div>
      </template>
    </el-upload>

    <div class="file-action">
      <el-button
        type="primary"
        :disabled="!fileList.length || isConverting"
        @click="convertImages"
      >
        {{ isConverting ? '转换中...' : '开始转换' }}
      </el-button>
    </div>

    <div class="file-list">
      <div v-for="(file, index) in fileList" :key="index" class="file-item">
        <span>{{ file.name }}</span>
        <el-button
          v-if="file.customStatus === 'done'"
          type="success"
          :icon="Download"
          @click="downloadFile(file.url, file.name)"
        >
          下载 WebP
        </el-button>
        <el-tag v-else-if="file.customStatus === 'error'" type="danger">
          转换失败
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled, Download } from '@element-plus/icons-vue';

interface FileItem extends File {
  url?: string;
  customStatus?: 'pending' | 'done' | 'error';
}

const fileList = ref<FileItem[]>([]);
const isConverting = ref(false);

const handleFileChange = (file: FileItem) => {
  if ((file?.size || 0) > 4 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过4MB');
    return false;
  }
  file.customStatus = 'pending';
};

const fileToBuffer = (file: File) => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsArrayBuffer(file);
		reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
		reader.onerror = reject;
	});
}

const convertImages = async () => {
  isConverting.value = true;
  try {
    const convertedFiles = await Promise.all(
      fileList.value.map(async (file: File) => {
        try {
          const buffer = await fileToBuffer(file);

          const response = await fetch('/api/convert', {
            method: 'POST',
            body: buffer as unknown as BodyInit,
            headers: {
              'Content-Type': file.type,
            },
          });

          if (!response.ok) throw new Error('转换失败');

          const blob = await response.blob();
          return {
            ...file,
            customStatus: 'done',
            url: URL.createObjectURL(blob),
          };
        } catch (error) {
          console.error(error);
          return { ...file, customStatus: 'error' };
        }
      })
    );

    fileList.value = convertedFiles as FileItem[];
  } finally {
    isConverting.value = false;
  }
};

const downloadFile = (url?: string, name?: string) => {
  const link = document.createElement('a');
  link.href = url || '';
  link.download = `converted-${name}.webp`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
}

.file-action {
  margin-top: 1rem;
}

.file-list {
  margin-top: 1rem;
}

.file-item {
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>