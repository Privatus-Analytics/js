<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 col-md-8 px-0 mb-4" tabindex="0">
			<form role="form" class="privatus-analytics-settings">
				<div class="mb-4">
					<h5 class="fw-bold tracking-tight settings-header">Tracking</h5>

					<p class="lead">
						Privatus Analytics counts visits to your forum without cookies.
						Paste your site id and save. The script is then added to every forum page.
					</p>

					<div class="mb-3">
						<label class="form-label" for="siteId">Site id</label>
						<input type="text" id="siteId" name="siteId" data-key="siteId" class="form-control" placeholder="pa_XXXXXXXXXX" autocomplete="off" spellcheck="false">
						<p class="form-text">
							Find it in Privatus Analytics under Site settings, Tracking. It starts with <code>pa_</code>.
							Leave it empty to stop tracking.
						</p>
					</div>

					<div class="form-check form-switch mb-3">
						<input type="checkbox" class="form-check-input" id="skipAdmins" name="skipAdmins" data-key="skipAdmins">
						<label for="skipAdmins" class="form-check-label">Do not count visits from logged-in administrators</label>
					</div>

					<p class="form-text">
						No account yet? Sign up at <a href="https://privatusanalytics.com" target="_blank" rel="noopener">privatusanalytics.com</a>.
						Your reports are there, not in this admin panel.
					</p>
				</div>
			</form>
		</div>

		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>
