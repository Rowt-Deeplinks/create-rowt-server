interface UserProfileResponseDTO {
  id: number;
  email: string;
  role: string;
  emailVerified: boolean;
  customerId: string;
}

export default UserProfileResponseDTO;
