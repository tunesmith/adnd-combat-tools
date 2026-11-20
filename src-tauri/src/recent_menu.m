// AppKit owns the recent document URLs. Route menu selections back through the
// campaign editor's queued open command so pending edits and prompts still run.
#import <AppKit/AppKit.h>
#include <stdbool.h>

extern void campaign_recent_selected(const char *path);
extern void campaign_recent_clear_requested(void);

@interface ADNDRecentMenu : NSObject <NSMenuDelegate>
@end

@implementation ADNDRecentMenu
- (void)menuNeedsUpdate:(NSMenu *)menu {
    NSArray<NSURL *> *urls = NSDocumentController.sharedDocumentController.recentDocumentURLs;
    NSCountedSet *names = [NSCountedSet set];
    for (NSURL *url in urls) {
        [names addObject:url.lastPathComponent];
    }
    [menu removeAllItems];
    for (NSURL *url in urls) {
        NSString *title = url.lastPathComponent;
        if ([names countForObject:title] > 1) {
            title = [title stringByAppendingFormat:@" — %@", url.URLByDeletingLastPathComponent.path.stringByAbbreviatingWithTildeInPath];
        }
        NSMenuItem *item = [menu addItemWithTitle:title action:@selector(openCampaign:) keyEquivalent:@""];
        item.target = self;
        item.representedObject = url;
        item.toolTip = url.path;
    }
    if (urls.count) [menu addItem:NSMenuItem.separatorItem];
    NSMenuItem *clear = [menu addItemWithTitle:@"Clear Menu" action:@selector(clearMenu:) keyEquivalent:@""];
    clear.target = self;
    clear.enabled = urls.count > 0;
}

- (void)openCampaign:(NSMenuItem *)item {
    NSURL *url = item.representedObject;
    if (url.isFileURL) campaign_recent_selected(url.fileSystemRepresentation);
}

- (void)clearMenu:(id)sender {
    campaign_recent_clear_requested();
}
@end

// These entry points are only called on the main thread.
bool campaign_install_recent_menu(void) {
    NSMenu *file = [NSApp.mainMenu itemWithTitle:@"File"].submenu;
    NSMenu *recent = [file itemWithTitle:@"Open Recent"].submenu;
    if (!recent) return false;
    static ADNDRecentMenu *delegate; // NSMenu's delegate is weak.
    delegate = [ADNDRecentMenu new];
    recent.autoenablesItems = NO;
    recent.delegate = delegate;
    [delegate menuNeedsUpdate:recent];
    return true;
}

void campaign_note_recent(const char *path) {
    NSURL *url = [NSURL fileURLWithFileSystemRepresentation:path isDirectory:NO relativeToURL:nil];
    [NSDocumentController.sharedDocumentController noteNewRecentDocumentURL:url];
}

const char *campaign_last_recent_path(void) {
    return NSDocumentController.sharedDocumentController.recentDocumentURLs.firstObject.fileSystemRepresentation;
}

void campaign_clear_recents(void) {
    [NSDocumentController.sharedDocumentController clearRecentDocuments:nil];
}
