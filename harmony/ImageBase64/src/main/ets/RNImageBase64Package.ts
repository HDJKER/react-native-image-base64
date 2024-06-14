import { RNPackage, TurboModulesFactory } from '@rnoh/react-native-openharmony/ts';
import type { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import { RNImageBase64Module } from './RNImageBase64TurboModule'

class RNImageBase64ModulesFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (name == TM.RNImageBase64.NAME) {
      return new RNImageBase64Module(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name == TM.RNImageBase64.NAME;
  }
}

export class RNImageBase64Package extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new RNImageBase64ModulesFactory(ctx);
  }
}