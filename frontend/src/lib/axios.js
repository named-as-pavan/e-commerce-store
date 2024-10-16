import axios from 'axios'


const axiosInstance = axios.create({
    baseURL: import.meta.mode === "development" ? "http://localhost:5000/api" : "/api",
    withCredentials: true,   //sends cookies to the server in every request

})

export default axiosInstance