import axios from 'axios';

const { apiHost = '' } = window.stravoxConfig || {};
const wootAPI = axios.create({ baseURL: `${apiHost}/` });

export default wootAPI;
