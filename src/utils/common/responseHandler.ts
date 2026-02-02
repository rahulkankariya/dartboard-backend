import { Response } from 'express';
import { t } from '../../config'; 
import { HTTP_STATUS } from './statusCode';

type ResponseOptions = {
  res: Response;
  messageKey?: string;  
  data?: any;          
  status?: number;      
  req?: any;            
};

export const sendResponse = ({
  res,
  messageKey,
  data,
  status,
  req
}: ResponseOptions) => {
  const code = status || (messageKey ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.OK);
    const lang = (req as any)?.language || req?.headers['accept-language']?.toString() || 'en';

  const message = messageKey ? t(messageKey, {}, lang) : null;

  return res.status(code).json({
    // status: code,
    message: message ||'Error occurred' ,
    data: data || null,
  });
};
