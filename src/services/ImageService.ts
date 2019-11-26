type Predictions = any;

import * as jpeg from 'jpeg-js';
import * as tf from '@tensorflow/tfjs';
import { decode } from 'base64-arraybuffer';

export function imageToTensor (image: any): tf.Tensor3D {
  // base64 to ArrayBuffer
  let arrayBuffer: ArrayBuffer = decode(image.data);
  
  // ArrayBuffer to Uint8Array
  const TO_UINT8ARRAY = true;
  const { width, height, data } = jpeg.decode(arrayBuffer, TO_UINT8ARRAY);
  
  // Drop the alpha channel info for mobilenet
  const buffer = new Uint8Array(width * height * 3);
  let offset = 0; // offset into original data
  for (let i = 0; i < buffer.length; i += 3) {
    buffer[i] = data[offset];
    buffer[i + 1] = data[offset + 1];
    buffer[i + 2] = data[offset + 2];

    offset += 4;
  }

  // Uint8Array to tensor
  return tf.tensor3d(buffer, [height, width, 3]);
}

export async function classifyImage (model: any, image: any): Promise<Predictions> {
  try {
    const imageTensor = imageToTensor(image);

    const start = Date.now();
    const predictions = await model.classify(imageTensor);
    const end = Date.now();
    console.warn(end - start);

    return predictions;
    
  } catch (error) {
    console.warn(error);
    return null;
  }
}

export default {
  imageToTensor,
  classifyImage
}
