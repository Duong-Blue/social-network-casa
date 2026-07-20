import * as SecureStore from 'expo-secure-store'

export const setToken = (token: string) =>
  SecureStore.setItemAsync('access_token', token)

export const saveToken = (token: string) =>
  SecureStore.setItemAsync('access_token', token)

export const getToken = () =>
  SecureStore.getItemAsync('access_token')

export const removeToken = () =>
  SecureStore.deleteItemAsync('access_token')
