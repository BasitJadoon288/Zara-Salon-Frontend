// Picture ko upload se pehle chhota karta hai (JPG). Size limit se bari ho to quality aur size khud kam karta hai.
export function compressImage(file: File, opts: { maxSide: number; maxChars: number }): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode'));
      img.onload = () => {
        let side = opts.maxSide;
        for (let attempt = 0; attempt < 6; attempt++) {
          const scale = Math.min(1, side / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('canvas')); return; }
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          for (const quality of [0.82, 0.7, 0.6, 0.5]) {
            const url = canvas.toDataURL('image/jpeg', quality);
            if (url.length <= opts.maxChars) { resolve(url); return; }
          }
          side = Math.round(side * 0.8); // abhi bhi bari hai, size chhota karke dobara
        }
        reject(new Error('too-large'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
