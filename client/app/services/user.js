import { isString } from 'lodash';
import { $http, $sanitize, toastr } from '@/services/ng';

export let User = null; // eslint-disable-line import/no-mutable-exports

function disableResource(user) {
  return `api/users/${user.id}/disable`;
}

function enableUser(user) {
  const userName = $sanitize(user.name);

  return $http
    .delete(disableResource(user))
    .then((data) => {
      toastr.success(`User <b>${userName}</b> is now enabled.`, { allowHtml: true });
      user.is_disabled = false;
      user.profile_image_url = data.data.profile_image_url;
      return data;
    })
    .catch((response) => {
      let message = response instanceof Error ? response.message : response.statusText;
      if (!isString(message)) {
        message = 'Unknown error';
      }
      toastr.error(`Cannot enable user <b>${userName}</b><br>${message}`, { allowHtml: true });
    });
}

function disableUser(user) {
  const userName = $sanitize(user.name);
  return $http
    .post(disableResource(user))
    .then((data) => {
      toastr.warning(`User <b>${userName}</b> is now disabled.`, { allowHtml: true });
      user.is_disabled = true;
      user.profile_image_url = data.data.profile_image_url;
      return data;
    })
    .catch((response) => {
      const message =
        response.data && response.data.message
          ? response.data.message
          : `Cannot disable user <b>${userName}</b><br>${response.statusText}`;

      toastr.error(message, { allowHtml: true });
    });
}

function deleteUser(user) {
  const userName = $sanitize(user.name);
  return $http
    .delete(`api/users/${user.id}`)
    .then((data) => {
      toastr.warning(`User <b>${userName}</b> has been deleted.`, { allowHtml: true });
      return data;
    })
    .catch((response) => {
      const message =
        response.data && response.data.message
          ? response.data.message
          : `Cannot delete user <b>${userName}</b><br>${response.statusText}`;

      toastr.error(message, { allowHtml: true });
    });
}

function UserService($resource) {
  const actions = {
    get: { method: 'GET' },
    save: { method: 'POST' },
    query: { method: 'GET', isArray: false },
    delete: { method: 'DELETE' },
    disable: { method: 'POST', url: 'api/users/:id/disable' },
    enable: { method: 'DELETE', url: 'api/users/:id/disable' },
  };

  const UserResource = $resource('api/users/:id', { id: '@id' }, actions);

  UserResource.enableUser = enableUser;
  UserResource.disableUser = disableUser;
  UserResource.deleteUser = deleteUser;

  return UserResource;
}

export default function init(ngModule) {
  ngModule.factory('User', UserService);

  ngModule.run(($injector) => {
    User = $injector.get('User');
  });
}

init.init = true;
