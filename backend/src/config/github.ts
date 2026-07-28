import axios from 'axios'

export const github = axios.create({
  baseURL: "http://github.com"
})