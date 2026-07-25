import request from '../utils/request';

interface LoginVO {
  token: string;
  username: string;
  nickname: string;
}

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request.post<LoginVO>('/api/v1/auth/login', data),
};
