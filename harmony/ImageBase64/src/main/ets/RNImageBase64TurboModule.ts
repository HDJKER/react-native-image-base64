import { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import image from '@ohos.multimedia.image';
import util from '@ohos.util';
import http from '@ohos.net.http';
import { BusinessError } from '@kit.BasicServicesKit';
import { promptAction } from '@kit.ArkUI';
import fs from '@ohos.file.fs';
import { JSON, url } from '@kit.ArkTS';

export class RNImageBase64Module extends TurboModule implements TM.RNImageBase64.Spec {
  static Name = 'RNImageBase64';
  getName(): string {
    return 'RNImageBase64'
  }
  private context: TurboModuleContext
  constructor(ctx: TurboModuleContext) {
    super(ctx);
    this.context = ctx;
  }
  // store the type of image
  private imageType: string

  // main function for getting base64 type of the image by its uri
  async getBase64String(uri: string): Promise<string> {
    let imagePixelMap: image.PixelMap;
    try {
      if (uri.includes('http')) {
        // online picture to pixelMap
        imagePixelMap = await this.getPixelMapFromURL(uri);
      } else {
        imagePixelMap = await this.getPixelMapFromFile(uri);
      }
      if (imagePixelMap == null) {
        Promise.reject('Error Bad uri, Failed to decode PixelMap: uri ' + uri);
      }
      return await this.pixelMapToBase64(imagePixelMap);
    } catch (err) {
      Promise.reject(`Func getBase64String bad,err = ${JSON.stringify(err)}`);
    }
  }

  // 网络图片转换为PixelMap
  private async getPixelMapFromURL(src: string): Promise<image.PixelMap> {
    try {
      const data: http.HttpResponse = await http.createHttp().request(src);
      if (data.responseCode !== http.ResponseCode.OK) {
        promptAction.showToast({
          message: '图片获取失败',
          duration: 2000,
        });
        throw new Error('图片获取失败');
      }
      this.imageType = data.header['content-type'];
      const imageData: ArrayBuffer = data.result as ArrayBuffer;
      const imageSource: image.ImageSource = image.createImageSource(imageData);
      // TODO 样式模板化处理
      const option: image.InitializationOptions = {
        'alphaType': 0,
        'editable': false,
        'pixelFormat': 3,
        'scaleMode': 1,
        'size': { height: 100, width: 100 },
      }
      const pixelMap: image.PixelMap = await imageSource.createPixelMap(option);
      return pixelMap;
    } catch (error) {
      throw error;
    }
  }

  // 本地图片url转pixelMap
  // src对应的是本地图片的协议url
  private async getPixelMapFromFile(src: string): Promise<image.PixelMap> {
    let file = fs.openSync(src, fs.OpenMode.READ_ONLY);
    try {
      const imageSource = image.createImageSource(file.fd);
      const imagePackApi = image.createImagePacker();
      // TODO 获取本地图片的类型
      let packOpts: image.PackingOption = {
        format: 'image/png',
        quality: 100,
      }
      const readBuffer = await imagePackApi.packing(imageSource, packOpts);
      const imageSourceFromBuffer: image.ImageSource = image.createImageSource(readBuffer as ArrayBuffer);
      // TODO 样式模板化处理
      const option: image.InitializationOptions = {
        'alphaType': 0,
        'editable': false,
        'pixelFormat': 3,
        'scaleMode': 1,
        'size': { height: 100, width: 100 },
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
        let base64Str = helper.encodeToStringSync(buf); // 转化为base64格式
        resolve(base64Str);
      }).catch((error: BusinessError) => {
        reject(error);
      })
    })
  }
}