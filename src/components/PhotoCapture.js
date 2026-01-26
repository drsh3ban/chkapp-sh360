import { compressImage, validateImageFile } from '../utils/imageHelpers'
import { getGuideForSlot } from '../utils/carGuides'
import { Toast } from '../components/Toast'

/**
 * PhotoCapture Component
 * Allows users to capture photos using device camera or upload from gallery
 */
export class PhotoCapture {
  constructor(options = {}) {
    this.onPhotoTaken = options.onPhotoTaken || (() => { })
    this.onError = options.onError || ((err) => console.error(err))
    this.slots = options.slots || [] // [{id: 'front', label: 'الآمامية'}]
    this.maxPhotos = options.maxPhotos || this.slots.length || 4
    this.label = options.label || 'التقاط صورة'
    this.onScan = options.onScan || null
    this.onDamageScan = options.onDamageScan || null
    this.sequentialMode = options.sequentialMode || false
    this.photos = options.initialPhotos || [] // Existing behavior: array of photos
    this.photoMap = {} // New behavior: Map slotId -> photo
    this.containerId = options.containerId || 'photo-capture-' + Date.now()

    // Initialize photoMap from slots
    if (this.slots.length > 0) {
      this.slots.forEach(slot => {
        this.photoMap[slot.id] = null;
      });
    }
  }

  render(container) {
    // If photos exists but photoMap is empty (migration/initial load), fill photoMap
    if (this.photos.length > 0 && Object.values(this.photoMap).every(v => v === null)) {
      this.photos.forEach((p, i) => {
        if (this.slots[i]) this.photoMap[this.slots[i].id] = p;
      });
    }

    container.innerHTML = `
      <div id="${this.containerId}" class="space-y-4">
        <div class="flex justify-between items-center mb-3">
          <label class="block text-sm font-bold text-slate-700">${this.label}</label>
          <div class="flex items-center gap-3">
              ${this.sequentialMode ? `
                <button type="button" id="${this.containerId}-start-seq" class="bg-primary-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-primary-700 transition shadow-md flex items-center gap-2">
                    <i class="fas fa-play"></i>
                    بدء فحص كامل
                </button>
              ` : ''}
              <span class="text-xs text-slate-500 font-bold">${this.getCapturedCount()} / ${this.maxPhotos}</span>
          </div>
        </div>
        
        <!-- Photo Grid -->
        <div id="${this.containerId}-grid" class="grid grid-cols-2 gap-3">
          ${this.slots.length > 0 ? this.renderSlots() : this.renderPhotoSlots()}
        </div>
        
        <!-- Hidden File Input -->
        <input 
          type="file" 
          id="${this.containerId}-input" 
          accept="image/*" 
          capture="environment"
          class="hidden"
        >
      </div>
    `

    this.attachEventListeners()
    return this.getPhotos()
  }

  getCapturedCount() {
    if (this.slots.length > 0) {
      return Object.values(this.photoMap).filter(v => v !== null).length;
    }
    return this.photos.length;
  }

  renderSlots() {
    return this.slots.map(slot => {
      const photo = this.photoMap[slot.id];
      if (photo) {
        const src = photo.data || photo;
        let displaySrc = src;
        if (src && !src.startsWith('data:image') && window.Capacitor && window.Capacitor.convertFileSrc) {
          displaySrc = window.Capacitor.convertFileSrc(src);
        }
        return `
                <div class="relative group aspect-video bg-slate-100 rounded-2xl overflow-hidden border-2 border-primary-500 shadow-md">
                    <img src="${displaySrc}" class="w-full h-full object-cover" alt="${slot.label}">
                    <div class="absolute top-2 right-2 flex gap-2">
                        <button 
                            type="button"
                            data-slot-id="${slot.id}"
                            class="photo-scan-btn bg-primary-600 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-primary-700 flex items-center justify-center"
                        >
                            <i class="fas fa-magic"></i>
                        </button>
                        <button 
                            type="button"
                            data-slot-id="${slot.id}"
                            class="photo-delete-btn bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 flex items-center justify-center"
                        >
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <span class="text-white text-[10px] font-bold">${slot.label}</span>
                    </div>
                </div>
            `;
      } else {
        return `
                <button 
                    type="button"
                    data-slot-id="${slot.id}"
                    class="slot-add-btn aspect-video bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer group"
                >
                    <div class="w-8 h-8 rounded-full bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center transition">
                        <i class="fas fa-camera text-primary-600 text-sm"></i>
                    </div>
                    <span class="text-[10px] font-bold text-slate-500 group-hover:text-primary-600">${slot.label}</span>
                </button>
            `;
      }
    }).join('');
  }

  // Legacy support for dynamic array
  renderPhotoSlots() {
    const slots = []
    this.photos.forEach((photo, index) => {
      const src = photo.data || photo
      let displaySrc = src
      if (src && !src.startsWith('data:image') && window.Capacitor && window.Capacitor.convertFileSrc) {
        displaySrc = window.Capacitor.convertFileSrc(src)
      }
      slots.push(`
        <div class="relative group aspect-video bg-slate-100 rounded-2xl overflow-hidden border-2 border-primary-200 shadow-md">
          <img src="${displaySrc}" class="w-full h-full object-cover" alt="صورة ${index + 1}">
          <div class="absolute top-2 right-2 flex gap-2">
            <button type="button" data-photo-index="${index}" class="photo-scan-btn bg-primary-600 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center justify-center">
                <i class="fas fa-magic"></i>
            </button>
            <button type="button" data-photo-index="${index}" class="photo-delete-btn bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center justify-center">
                <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
            <span class="text-white text-xs font-bold">صورة ${index + 1}</span>
          </div>
        </div>
      `)
    })
    const emptySlots = this.maxPhotos - this.photos.length
    for (let i = 0; i < emptySlots; i++) {
      slots.push(`
        <button type="button" class="photo-add-btn aspect-video bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary-500 flex flex-col items-center justify-center gap-2">
          <i class="fas fa-camera text-primary-600 text-xl"></i>
          <span class="text-xs font-bold text-slate-500">التقاط</span>
        </button>
      `)
    }
    return slots.join('')
  }

  attachEventListeners() {
    const container = document.getElementById(this.containerId)
    if (!container) return

    // Start Sequence button
    const startBtn = document.getElementById(`${this.containerId}-start-seq`)
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startSequence())
    }

    // Individual Slot Add buttons
    container.querySelectorAll('.slot-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slotId = btn.dataset.slotId;
        const slot = this.slots.find(s => s.id === slotId);
        if (slot) {
          this.activeSlotId = slotId;
          // For manual clicks, we show the guide but don't auto-start the next sequence
          // unless we decide to. But usually manual = just that one.
          this.showGuide(slot);
        }
      })
    })

    // Legacy photo add
    container.querySelectorAll('.photo-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeSlotId = null;
        this.triggerCapture();
      })
    })

    // Delete buttons
    container.querySelectorAll('.photo-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slotId = btn.dataset.slotId;
        const index = btn.dataset.photoIndex;
        if (slotId) {
          this.removePhotoBySlot(slotId);
        } else {
          this.removePhoto(parseInt(index));
        }
      })
    })

    // Scan buttons
    container.querySelectorAll('.photo-scan-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slotId = btn.dataset.slotId;
        const index = btn.dataset.photoIndex;
        const photo = slotId ? this.photoMap[slotId] : this.photos[index];
        if (this.onScan && photo) {
          this.onScan(photo, slotId || index);
        }
      })
    })

    // Old guide buttons removed - now using live camera overlay

    const input = document.getElementById(`${this.containerId}-input`)
    if (input) {
      input.addEventListener('change', (e) => this.handleFileSelect(e))
    }
  }

  startSequence() {
    // Find first empty slot
    const nextSlot = this.slots.find(s => !this.photoMap[s.id]);
    if (nextSlot) {
      this.activeSlotId = nextSlot.id;
      this.showGuide(nextSlot);
    } else {
      Toast.info('تم التقاط جميع الصور المطلوبة');
    }
  }

  showGuide(slot) {
    // Now uses live camera instead of static guide
    this.activeSlotId = slot.id;
    this.startLiveCamera(slot);
  }

  hideGuide() {
    this.activeSlotId = null;
  }

  async startLiveCamera(slot) {
    // Phase 2.0: Bypassing WebRTC to solve Zoom/Scale issues permanently
    // We now redirect straight to the Native Camera App which is hardware-optimized
    this.activeSlotId = slot.id;
    await this.triggerNativeCapture();
  }

  // Legacy WebRTC methods removed in v2.0.0

  async triggerNativeCapture() {
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    if (isNative) {
      try {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const image = await Camera.getPhoto({
          quality: 60,
          width: 1280,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera
        });

        if (image && image.base64String) {
          const base64Data = `data:image/${image.format};base64,${image.base64String}`;
          this.addPhoto({
            data: base64Data,
            timestamp: new Date().toISOString(),
            originalName: `photo_${Date.now()}.${image.format}`,
            size: image.base64String.length * 0.75
          });
        }
      } catch (error) {
        console.error('Native Camera Error:', error);
      }
    } else {
      this.fallbackToWebCapture();
    }
  }

  async triggerCapture() {
    // Now redirects to live camera
    if (this.activeSlotId) {
      const slot = this.slots.find(s => s.id === this.activeSlotId);
      if (slot) this.startLiveCamera(slot);
    } else {
      this.triggerNativeCapture();
    }
  }

  fallbackToWebCapture() {
    const input = document.getElementById(`${this.containerId}-input`);
    if (input) input.click();
  }

  async handleFileSelect(event) {
    const file = event.target.files[0]
    if (!file) return
    try {
      validateImageFile(file)
      const compressedBase64 = await compressImage(file, {
        maxSizeMB: 0.3, // Even smaller footprint for web uploads
        maxWidthOrHeight: 1280,
        useWebWorker: true
      })
      this.addPhoto({
        data: compressedBase64,
        timestamp: new Date().toISOString(),
        originalName: file.name,
        size: file.size
      })
      event.target.value = ''
    } catch (error) {
      this.onError(error)
      alert('خطأ في معالجة الصورة: ' + error.message)
    }
  }

  addPhoto(photoRecord) {
    // Visual Feedback: Camera Flash
    const flash = document.createElement('div');
    flash.className = 'fixed inset-0 z-[2000] bg-white animate-flash-fast pointer-events-none';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);

    if (this.activeSlotId) {
      this.photoMap[this.activeSlotId] = photoRecord;
    } else {
      this.photos.push(photoRecord);
    }

    this.onPhotoTaken(this.getPhotos());
    const container = document.getElementById(this.containerId).parentElement;
    this.render(container);

    // If sequential mode, auto-trigger next
    if (this.sequentialMode) {
      setTimeout(() => {
        const nextSlot = this.slots.find(s => !this.photoMap[s.id]);
        if (nextSlot) {
          this.activeSlotId = nextSlot.id;
          this.showGuide(nextSlot);
        } else {
          Toast.success('تم الانتهاء من جميع الصور');
        }
      }, 500);
    }
  }

  removePhotoBySlot(slotId) {
    if (confirm('هل تريد حذف هذه الصورة؟')) {
      this.photoMap[slotId] = null;
      this.onPhotoTaken(this.getPhotos());
      const container = document.getElementById(this.containerId).parentElement;
      this.render(container);
    }
  }

  removePhoto(index) {
    if (confirm('هل تريد حذف هذه الصورة؟')) {
      this.photos.splice(index, 1)
      this.onPhotoTaken(this.getPhotos())
      const container = document.getElementById(this.containerId).parentElement
      this.render(container)
    }
  }

  getPhotos() {
    if (this.slots.length > 0) {
      // Return photos in the same order as slots
      return this.slots.map(slot => this.photoMap[slot.id]).filter(v => v !== null);
    }
    return this.photos
  }

  setPhotos(photos) {
    if (this.slots.length > 0) {
      // Match photos to slots by index for setPhotos
      photos.forEach((p, i) => {
        if (this.slots[i]) this.photoMap[this.slots[i].id] = p;
      });
    } else {
      this.photos = photos || [];
    }
  }

  clear() {
    this.photos = []
    Object.keys(this.photoMap).forEach(k => this.photoMap[k] = null);
  }
}

/**
 * Helper function to create a photo capture instance
 */
export function createPhotoCapture(containerId, options = {}) {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error(`Container ${containerId} not found`)
    return null
  }

  const photoCapture = new PhotoCapture({
    ...options,
    containerId
  })

  photoCapture.render(container)
  return photoCapture
}
