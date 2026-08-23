const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

const DATA_EXTRACTION_RULES = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="root" path="." />
    </cloud-backup>
    <device-transfer>
        <exclude domain="root" path="." />
    </device-transfer>
</data-extraction-rules>
`;

const FULL_BACKUP_RULES = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <exclude domain="root" path="." />
</full-backup-content>
`;

module.exports = function withAndroidHardening(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (application) {
      application["$"] = application["$"] || {};
      application["$"]["android:allowBackup"] = "false";
      application["$"]["android:usesCleartextTraffic"] = "true";
      application["$"]["android:dataExtractionRules"] = "@xml/home_dashboard_data_extraction_rules";
      application["$"]["android:fullBackupContent"] = "@xml/home_dashboard_full_backup_rules";
    }
    return mod;
  });
  return withDangerousMod(config, ["android", async (mod) => {
    const resourceDirectory = path.join(mod.modRequest.platformProjectRoot, "app", "src", "main", "res", "xml");
    fs.mkdirSync(resourceDirectory, { recursive: true });
    fs.writeFileSync(path.join(resourceDirectory, "home_dashboard_data_extraction_rules.xml"), DATA_EXTRACTION_RULES);
    fs.writeFileSync(path.join(resourceDirectory, "home_dashboard_full_backup_rules.xml"), FULL_BACKUP_RULES);
    return mod;
  }]);
};
