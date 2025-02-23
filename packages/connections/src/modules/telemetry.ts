import { ConnectionInfo, DataService } from 'mongodb-data-service';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { isLocalhost, isDigitalOcean, isAtlas } from 'mongodb-build-info';
import { getCloudInfo } from 'mongodb-cloud-info';
import ConnectionString from 'mongodb-connection-string-url';

const { track, debug } = createLoggerAndTelemetry('COMPASS-CONNECT-UI');

async function getHostInformation(host: string) {
  const defaultValues = {
    is_localhost: false,
    is_public_cloud: false,
    is_do_url: false,
    is_atlas_url: false,
    public_cloud_name: '',
  };

  if (isLocalhost(host)) {
    return {
      ...defaultValues,
      is_localhost: true,
    };
  }

  if (isDigitalOcean(host)) {
    return {
      ...defaultValues,
      is_do_url: true,
    };
  }

  const { isAws, isAzure, isGcp } = await getCloudInfo(host).catch(
    (err: Error) => {
      debug('getCloudInfo failed', err);
      return {};
    }
  );
  const isPublicCloud = isAws || isAzure || isGcp;
  const publicCloudName = isAws
    ? 'AWS'
    : isAzure
    ? 'Azure'
    : isGcp
    ? 'GCP'
    : '';

  return {
    is_localhost: false,
    is_public_cloud: !!isPublicCloud,
    is_do_url: false,
    is_atlas_url: isAtlas(host),
    public_cloud_name: publicCloudName,
  };
}

async function getConnectionData({
  connectionOptions: { connectionString, sshTunnel },
}: Pick<ConnectionInfo, 'connectionOptions'>): Promise<
  Record<string, unknown>
> {
  const connectionStringData = new ConnectionString(connectionString);
  const hostName = connectionStringData.hosts[0];

  const authMechanism = connectionStringData.searchParams.get('authMechanism');
  const authType = authMechanism
    ? authMechanism
    : connectionStringData.username
    ? 'DEFAULT'
    : 'NONE';

  return {
    ...(await getHostInformation(hostName)),
    auth_type: authType.toUpperCase(),
    tunnel: sshTunnel ? 'ssh' : 'none',
    is_srv: connectionStringData.isSRV,
  };
}

export function trackConnectionAttemptEvent({
  favorite,
  lastUsed,
}: Pick<ConnectionInfo, 'favorite' | 'lastUsed'>): void {
  try {
    const trackEvent = {
      is_favorite: Boolean(favorite),
      is_recent: Boolean(lastUsed && !favorite),
      is_new: !lastUsed,
    };
    track('Connection Attempt', trackEvent);
  } catch (error) {
    debug('trackConnectionAttemptEvent failed', error);
  }
}

export function trackNewConnectionEvent(
  connectionInfo: Pick<ConnectionInfo, 'connectionOptions'>,
  dataService: Pick<DataService, 'instance'>
): void {
  try {
    const callback = async () => {
      const {
        dataLake,
        genuineMongoDB,
        host,
        build,
        isAtlas: isAtlasInstance,
      } = await dataService.instance();
      const connectionData = await getConnectionData(connectionInfo);
      const trackEvent = {
        ...connectionData,
        is_atlas: isAtlasInstance,
        is_dataLake: dataLake.isDataLake,
        is_enterprise: build.isEnterprise,
        is_genuine: genuineMongoDB.isGenuine,
        non_genuine_server_name: genuineMongoDB.dbType,
        server_version: build.version,
        server_arch: host.arch,
        server_os_family: host.os_family,
      };
      return trackEvent;
    };
    track('New Connection', callback);
  } catch (error) {
    debug('trackNewConnectionEvent failed', error);
  }
}

export function trackConnectionFailedEvent(
  connectionInfo: Pick<ConnectionInfo, 'connectionOptions'>,
  connectionError: any
): void {
  try {
    const callback = async () => {
      const connectionData = await getConnectionData(connectionInfo);
      const trackEvent = {
        ...connectionData,
        error_code: connectionError.code,
        error_name: connectionError.codeName ?? connectionError.name,
      };
      return trackEvent;
    };
    track('Connection Failed', callback);
  } catch (error) {
    debug('trackConnectionFailedEvent failed', error);
  }
}
