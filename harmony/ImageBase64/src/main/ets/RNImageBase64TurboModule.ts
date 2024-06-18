import { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import image from '@ohos.multimedia.image';
import util from '@ohos.util';
import http from '@ohos.net.http';
import { BusinessError } from '@kit.BasicServicesKit';
import fs from '@ohos.file.fs';
import { JSON, url } from '@kit.ArkTS';

export class RNImageBase64Module extends TurboModule implements TM.RNImageBase64.Spec {
  static Name = TM.RNImageBase64.NAME;
  getName(): string {
    return 'RNImageBase64'
  }
  private context: TurboModuleContext
  constructor(ctx: TurboModuleContext) {
    super(ctx);
    this.context = ctx;
  }
  // store the type of image, default as 'image/png'
  private imageType: string = 'image/png'

  // main function for getting base64 type of the image by its uri
  async getBase64String(uri: string): Promise<string> {
    let imagePixelMap: image.PixelMap | undefined = undefined;
    try {
      if (uri.includes('http')) {
        // online picture to pixelMap
        imagePixelMap = await this.getPixelMapFromURL(uri);
      } else {
        imagePixelMap = await this.getPixelMapFromFile(uri);
      }
      if (imagePixelMap === undefined) {
        Promise.reject('Error Bad uri, Failed to decode PixelMap: uri ' + uri);
      }
      return await this.pixelMapToBase64(imagePixelMap);
    } catch (err) {
      Promise.reject(`Func getBase64String bad,err = ${JSON.stringify(err)}`);
    }
  }

  // 网络图片转换为PixelMap
  private async getPixelMapFromURL(src: string): Promise<image.PixelMap> {
    const data: http.HttpResponse = await http.createHttp().request(src);
    if (data.responseCode === http.ResponseCode.OK && data.result instanceof ArrayBuffer) {
      if (data.header.hasOwnProperty('content-type')) {
        this.imageType = data.header['content-type'];
      }
      let imageData: ArrayBuffer = data.result;
      const imageSource: image.ImageSource = image.createImageSource(imageData);
      const imageInfo = await imageSource.getImageInfo();
      const imageWidth = Math.round(imageInfo.size.width);
      const imageHeight = Math.round(imageInfo.size.height);
      const option: image.InitializationOptions = {
        'alphaType': 0,
        'editable': false,
        'pixelFormat': 3,
        'scaleMode': 1,
        'size': { height: imageHeight, width: imageWidth },
      }
      let pixelMap: image.PixelMap = await imageSource.createPixelMap(option);
      return pixelMap;
    }
  }

  // 本地图片uri转pixelMap
  // src对应的是本地图片的协议url
  private async getPixelMapFromFile(src: string): Promise<image.PixelMap> {
    let file = fs.openSync(src, fs.OpenMode.READ_ONLY);
    try {
      const imageSource = image.createImageSource(file.fd);
      const imagePackApi = image.createImagePacker();
      const imageInfo = await imageSource.getImageInfo();
      this.imageType = imageInfo.mimeType;
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(this.imageType)) {
        this.imageType = 'image/png';
      }
      const packOpts: image.PackingOption = {
        format: `${this.imageType}`,
        quality: 100,
      }
      let readBuffer = await imagePackApi.packing(imageSource, packOpts);
      const imageSourceFromBuffer: image.ImageSource = image.createImageSource(readBuffer as ArrayBuffer);
      const imageWidth = Math.round(imageInfo.size.width);
      const imageHeight = Math.round(imageInfo.size.height);
      const option: image.InitializationOptions = {
        'alphaType': 0,
        'editable': false,
        'pixelFormat': 3,
        'scaleMode': 1,
        'size': { height: imageHeight, width: imageWidth },
      }
      return await imageSourceFromBuffer.createPixelMap(option);
    } catch (error) {
      throw error;
    } finally {
      fs.closeSync(file);
    }
  }

  private async pixelMapToBase64(pixelMap: image.PixelMap): Promise<string> {
    // 实例化对象以及预制转换条件
    const imagePackerApi: image.ImagePacker = image.createImagePacker();
    // 目前仅支持png jpeg webp三种格式
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(this.imageType)) {
      this.imageType = 'image/png';
    }
    let packOpts: image.PackingOption = {
      format: `${this.imageType}`,
      quality: 100,
    };
    // 进行格式转换
    return new Promise((resolve, reject) => {
      // the function will compress the image which based on packOpts.quality
      imagePackerApi.packing(pixelMap, packOpts).then((data: ArrayBuffer) => {
        let helper = new util.Base64Helper();
        let buf: Uint8Array = new Uint8Array(data);
        let base64Str = helper.encodeToStringSync(buf);
        resolve(base64Str);
      }).catch((error: BusinessError) => {
        reject(error);
      })
    })
  }
}