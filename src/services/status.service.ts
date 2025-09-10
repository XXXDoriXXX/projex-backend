import os from 'os';
import process from 'process';

export const getServerStatusInfo = () => {
    const memoryUsage = process.memoryUsage();

    return {
        serverTime: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        },
        cpu: {
            cores: os.cpus().length,
            model: os.cpus()[0].model,
            loadAvg: os.loadavg(),
        },
        env: {
            nodeEnv: process.env.NODE_ENV || 'development',
            port: process.env.PORT || 3000,
        },
        apiVersion: '1.0.0',
    };
};
