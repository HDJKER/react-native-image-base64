import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
    getBase64String(uri: string): Promise<string>;
}
export default TurboModuleRegistry.getEnforcing < Spec > ('RNImageBase64');
