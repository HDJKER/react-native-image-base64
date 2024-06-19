declare module 'react-native-image-base64' {
    const RNImgToBase64 {
        /**
         * Function used to obtain the corresponding image base64 format encoding
         *
         * @param   {string<string>}   uri  The uri pointing to the image, which can be an online image or a local image
         *
         * @return  {Promise<string>}       The base64 format string corresponding to the image
         */
        getBase64String(uri: string): Promise<string>;
};
export default RNImgToBase64;
}