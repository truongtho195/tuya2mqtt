import crypto from 'crypto'

const UDP_KEY_STRING = 'yGAdlopoPVldABfn';

export const UDP_KEY = crypto.createHash('md5').update(UDP_KEY_STRING, 'utf8').digest();
