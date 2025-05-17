import { JWTObject } from '../auth.repository.port';
import UserProfileResponseDTO from './UserProfileResponse.dto';

interface LoginResponseDTO {
  tokens: JWTObject;
  user: UserProfileResponseDTO;
}

export default LoginResponseDTO;
