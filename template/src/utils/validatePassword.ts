import RowtConfig from 'src/rowtconfig';

const passwordRequirements = RowtConfig.passwordRequirements || {
  minLength: 8,
  maxLength: 50,
  requireCapital: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialCharacter: true,
};

export const validatePassword = (password: string): boolean => {
  if (password.length < passwordRequirements.minLength) {
    return false;
  }

  if (password.length > passwordRequirements.maxLength) {
    return false;
  }

  if (passwordRequirements.requireCapital && !/[A-Z]/.test(password)) {
    return false;
  }

  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    return false;
  }

  if (passwordRequirements.requireNumber && !/[0-9]/.test(password)) {
    return false;
  }

  if (
    passwordRequirements.requireSpecialCharacter &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)
  ) {
    return false;
  }

  return true;
};
