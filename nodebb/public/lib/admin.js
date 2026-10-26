'use strict';

define('admin/plugins/privatus-analytics', ['settings'], function (settings) {
	var ACP = {};

	ACP.init = function () {
		var form = $('.privatus-analytics-settings');
		settings.load('privatus-analytics', form);

		$('#save').on('click', function () {
			var siteId = String($('#siteId').val() || '').trim();
			$('#siteId').val(siteId);
			if (siteId && !/^pa_[A-Za-z0-9]+$/.test(siteId)) {
				require(['alerts'], function (alerts) {
					alerts.error('The site id starts with pa_ followed by letters and numbers.');
				});
				return;
			}
			settings.save('privatus-analytics', form);
		});
	};

	return ACP;
});
