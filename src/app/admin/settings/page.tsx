import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, FileUp, FileDown, Database, Construction } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage system configuration and data operations
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Import/Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Import/Export
            </CardTitle>
            <CardDescription>
              Bulk operations for content management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/50 p-6 text-center">
              <Construction className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Coming Soon</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We&apos;re building powerful import/export tools to help you manage your content more efficiently.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-left">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Import Features</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                    <li>• CSV/JSON file upload</li>
                    <li>• Bulk content creation</li>
                    <li>• Relationship mapping</li>
                    <li>• Validation preview</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileDown className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Export Features</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                    <li>• Full database backup</li>
                    <li>• Filtered exports</li>
                    <li>• Multiple formats</li>
                    <li>• Scheduled exports</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Additional Settings
            </CardTitle>
            <CardDescription>
              More configuration options coming soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Future settings will include:</p>
              <ul className="space-y-2 ml-4">
                <li>• Content validation rules</li>
                <li>• Default values for new content</li>
                <li>• Performance optimization controls</li>
                <li>• System maintenance tools</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}