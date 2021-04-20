import axios from 'axios'

export const apiVariamos = axios.create({
    baseURL: 'http://localhost:4000/'
}) 

export function getLanguages() {
    try {
        apiVariamos.get('/languages').then(res => {
            console.log(res.data)
        })
    } catch (error) {
        console.log("Test Wrong")
    }
}