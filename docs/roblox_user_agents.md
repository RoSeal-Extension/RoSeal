Example user agent: `Mozilla/5.0 (2822MB; 720x1411; 320x319; 411x806; Samsung SM-A115F; 10) AppleWebKit/537.36 (KHTML, like Gecko)  Roblox Android App 2.448.411159 Phone Hybrid()  GooglePlayStore RobloxApp/2.448.411159 (GlobalDist; GooglePlayStore)`

- Appendings
    * `RobloxApp/` will indicate that the request is from in app, appending a version, `RobloxApp/0.0.0`, will tell the backend more information and allow it to do more stuff
    * `RobloxApp/` or `Roblox` in the user agent will force the page to be embeddedable
    * Sometimes, there is `RobloxStudio/VERSION` in the user agent, this is really only used in the emulator
    * The Studio device emulator will append `(Studio Emulator)` to the end of the user agent

- Distributions
    * Valid dist types are: `CJVDist` | `GlobalDist` | `VNGDist`
    * Valid dists are are `AppleAppStore` | `OculusQuest3Store` | `GooglePlayStore` | `AmazonAppStore` | `TencentAppStore` | `SamsungGalaxyStore` | `RobloxDirectDownload`
    * To indicate dist, append `(DistType; Dist)` at the end of the user agent.

- Examples
    * Android: `Mozilla/5.0 (2822MB; 720x1411; 320x319; 411x806; Samsung SM-A115F; 10) AppleWebKit/537.36 (KHTML, like Gecko)  Roblox Android App 2.448.411159 Phone Hybrid()  GooglePlayStore RobloxApp/2.448.411159 (GlobalDist; GooglePlayStore)`
    * iOS: `Mozilla/5.0 (iPhone; iPhone12,1; CPU iPhone OS 14.0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Mobile/9B176 Roblox iOS App 2.448.411159 Hybrid RobloxApp/2.448.411159 (GlobalDist; AppleAppStore)` 

- Others
  - `Roblox/XboxOne Roblox Xbox App 1.0.0`
  - `Roblox/PS4 ROBLOX PS4 App 0.0.0.3` 
  - `Roblox/PS5 ROBLOX PS5 App 0.0.0.3`
  - `Roblox/WinPCGDK ROBLOX PCGDK App 1.0.0` for handhelds

https://tableconvert.com/json-to-markdown

All user agents are the absolute minimal needed.

| osName      | typeId | type                       | deviceType | displayType                   | userAgent                                                                                 |
| ----------- | ------ | -------------------------- | ---------- | ----------------------------- | ----------------------------------------------------------------------------------------- |
| iOS         | 1      | iPad1                      | Tablet     | iPad 1                        | iPad1,1 ROBLOX iOS App                                                                    |
| iOS         | 2      | iPad2                      | Tablet     | iPad 2                        | iPad2,1 ROBLOX iOS App                                                                    |
| iOS         | 3      | iPad3                      | Tablet     | iPad 3                        | iPad3,1 ROBLOX iOS App                                                                    |
| OSX         | 4      | Mac                        | Computer   | Mac                           | Roblox/Darwin                                                                             |
| Windows     | 5      | PC                         | Computer   | PC                            | Roblox/WinInet                                                                            |
| Unknown     | 8      | Unknown                    | Computer   | Unknown                       | N/A                                                                                       |
| iOS         | 9      | iPhone3G                   | Phone      | iPhone 3G                     | iPhone1,2 ROBLOX iOS App                                                                  |
| iOS         | 10     | iPhone3GS                  | Phone      | iPhone 3GS                    | iPhone2,1 ROBLOX iOS App                                                                  |
| iOS         | 11     | iPhone4                    | Phone      | iPhone 4                      | iPhone3,1 ROBLOX iOS App                                                                  |
| iOS         | 12     | iPhone4S                   | Phone      | iPhone 4S                     | iPhone4,1 ROBLOX iOS App                                                                  |
| iOS         | 13     | iPhone5                    | Phone      | iPhone 5                      | iPhone5,1 ROBLOX iOS App                                                                  |
| iOS         | 14     | iPodTouch3G                | Phone      | iPod touch 3G                 | iPod3,1 ROBLOX iOS App                                                                    |
| iOS         | 15     | iPodTouch4G                | Phone      | iPod touch 4G                 | iPod4,1 ROBLOX iOS App                                                                    |
| iOS         | 16     | iPodTouch5G                | Phone      | iPod touch 5G                 | iPod5,1 ROBLOX iOS App                                                                    |
| iOS         | 17     | iPad4                      | Tablet     | iPad 4                        | iPad3,4 ROBLOX iOS App                                                                    |
| iOS         | 18     | iPadMini1G                 | Tablet     | iPad mini 1G                  | iPad2,5 ROBLOX iOS App                                                                    |
| iOS         | 19     | iPadMini2G                 | Tablet     | iPad mini 2G                  | iPad4,4 ROBLOX iOS App                                                                    |
| iOS         | 20     | iPadAir                    | Tablet     | iPad Air                      | iPad4,1 ROBLOX iOS App                                                                    |
| iOS         | 21     | iPhone5c                   | Phone      | iPhone 5c                     | iPhone5,3 ROBLOX iOS App                                                                  |
| iOS         | 22     | iPhone5s                   | Phone      | iPhone 5s                     | iPhone6,1 ROBLOX iOS App                                                                  |
| Android     | 23     | AndroidLowEndPhone         | Phone      | Android: low-end phone        | (1MB; 0x0; 0x0; 0x0; ; 0) ROBLOX Android Phone                                            |
| Android     | 24     | AndroidHighEndPhone        | Phone      | Android: high-end phone       | (1251MB; 0x0; 0x0; 0x0; ; 0) ROBLOX Android Phone                                         |
| Android     | 25     | AndroidLowEndTablet        | Tablet     | Android: low-end tablet       | (1MB; 0x0; 0x0; 0x0; ; 0) ROBLOX Android Tablet                                           |
| Android     | 26     | AndroidHighEndTablet       | Tablet     | Android: high-end tablet      | (1251MB; 0x0; 0x0; 0x0; ; 0) ROBLOX Android Tablet                                        |
| Android     | 27     | AndroidUnknown             | Computer   | Android: unknown              | ROBLOX Android                                                                            |
| iOS         | 28     | iOSUnknown                 | Computer   | iOS: unknown                  | iOS                                                                                       |
| Android     | 29     | AndroidUnknownPhone        | Phone      | Android: unknown phone        | Android Mobile                                                                            |
| Android     | 30     | AndroidUnknownTablet       | Tablet     | Android: unknown tablet       | Android                                                                                   |
| iOS         | 31     | iOSUnknownPhone            | Phone      | iOS: unknown phone            | iPhone                                                                                    |
| iOS         | 32     | iOSUnknownTablet           | Tablet     | iOS: unknown tablet           | iPad                                                                                      |
| iOS         | 33     | iPadMini3G                 | Tablet     | iPad mini 3G                  | iPad4,7 ROBLOX iOS App                                                                    |
| iOS         | 34     | iPadAir2                   | Tablet     | iPad Air 2                    | iPad5,3 ROBLOX iOS App                                                                    |
| iOS         | 35     | iPhone6                    | Phone      | iPhone 6                      | iPhone7,2 ROBLOX iOS App                                                                  |
| iOS         | 36     | iPhone6Plus                | Phone      | iPhone 6+                     | iPhone7,1 ROBLOX iOS App                                                                  |
| Windows     | 40     | WindowsUnknownTablet       | Tablet     | Windows: unknown tablet       | Windows Touch                                                                             |
| Windows     | 47     | WindowsLowEndTablet        | Tablet     | Windows: low-end tablet       | null                                                                                      |
| Windows     | 48     | WindowsHighEndTablet       | Tablet     | Windows: high-end tablet      | null                                                                                      |
| Windows     | 49     | WindowsUnknownPhone        | Phone      | Windows: unknown phone        | Windows Phone                                                                             |
| Windows     | 50     | WindowsLowEndPhone         | Phone      | Windows: low-end phone        | null                                                                                      |
| Windows     | 51     | WindowsHighEndPhone        | Phone      | Windows: high-end phone       | null                                                                                      |
| XboxOne     | 52     | XboxOne                    | Console    | Xbox: Xbox one                | Xbox                                                                                      |
| iOS         | 53     | iPodTouch6G                | Phone      | iPod touch 6G                 | iPod7,1 ROBLOX iOS App                                                                    |
| iOS         | 54     | iPhone6s                   | Phone      | iPhone 6s                     | iPhone8,1 ROBLOX iOS App                                                                  |
| iOS         | 55     | iPhone6sPlus               | Phone      | iPhone 6s+                    | iPhone8,2 ROBLOX iOS App                                                                  |
| iOS         | 56     | iPadMini4G                 | Tablet     | iPad mini 4G                  | iPad5,1 ROBLOX iOS App                                                                    |
| iOS         | 57     | iPadPro9_7                 | Tablet     | iPad Pro 9.7                  | iPad6,3 ROBLOX iOS App                                                                    |
| iOS         | 58     | iPadPro12_9                | Tablet     | iPad Pro 12.9                 | iPad6,7 ROBLOX iOS App                                                                    |
| iOS         | 59     | iPhoneSE                   | Phone      | iPhone SE                     | iPhone8,4 ROBLOX iOS App                                                                  |
| iOS         | 60     | iPhone7                    | Phone      | iPhone 7                      | iPhone9,1 ROBLOX iOS App                                                                  |
| iOS         | 61     | iPhone7Plus                | Phone      | iPhone 7+                     | iPhone9,2 ROBLOX iOS App                                                                  |
| Windows     | 62     | DesktopWindowsUwp          | Computer   | Desktop Windows UWP           | Roblox/WinUWP ROBLOX UWP App 1.0.0                                                        |
| iOS         | 63     | iPhone8                    | Phone      | iPhone 8                      | iPhone10,1 ROBLOX iOS App                                                                 |
| iOS         | 64     | iPhone8Plus                | Phone      | iPhone 8+                     | iPhone10,2 ROBLOX iOS App                                                                 |
| iOS         | 65     | iPhoneX                    | Phone      | iPhone X                      | iPhone10,3 ROBLOX iOS App                                                                 |
| Windows     | 66     | StudioWindows              | Computer   | Roblox Studio for Windows     | RobloxStudio/WinInet                                                                      |
| OSX         | 67     | StudioMac                  | Computer   | Roblox Studio for Mac         | RobloxStudio/Darwin                                                                       |
| iOS         | 68     | iPad6                      | Tablet     | iPad 6                        | iPad7,5 ROBLOX iOS App                                                                    |
| iOS         | 69     | iPadPro10_5                | Tablet     | iPad Pro 10.5                 | iPad7,3 ROBLOX iOS App                                                                    |
| iOS         | 70     | iPhoneXR                   | Phone      | iPhone XR                     | iPhone11,8 ROBLOX iOS App                                                                 |
| iOS         | 71     | iPhoneXS                   | Phone      | iPhone XS                     | iPhone11,2 ROBLOX iOS App                                                                 |
| iOS         | 72     | iPhoneXSMax                | Phone      | iPhone XS Max                 | iPhone11,4 ROBLOX iOS App                                                                 |
| Android     | 73     | Chromebook                 | Tablet     | Chromebook                    | ChromeOS                                                                                  |
| iOS         | 74     | iPad5                      | Tablet     | iPad 5                        | iPad6,11 ROBLOX iOS App                                                                   |
| iOS         | 75     | iPad7                      | Tablet     | iPad 7                        | iPad7,11 ROBLOX iOS App                                                                   |
| iOS         | 76     | iPadMini5G                 | Tablet     | iPad mini 5G                  | iPad11,1 ROBLOX iOS App                                                                   |
| iOS         | 77     | iPadAir3                   | Tablet     | iPad Air 3                    | iPad11,3 ROBLOX iOS App                                                                   |
| iOS         | 78     | iPadPro11                  | Tablet     | iPad Pro 11                   | iPad8,1 ROBLOX iOS App                                                                    |
| iOS         | 79     | iPadPro12_9_2              | Tablet     | iPad Pro 12.9 (2nd Gen)       | iPad7,1 ROBLOX iOS App                                                                    |
| iOS         | 80     | iPadPro12_9_3              | Tablet     | iPad Pro 12.9 (3rd Gen)       | iPad8,5 ROBLOX iOS App                                                                    |
| iOS         | 81     | iPodTouch7G                | Phone      | iPod touch 7G                 | iPod9,1 ROBLOX iOS App                                                                    |
| iOS         | 82     | iPhone11                   | Phone      | iPhone 11                     | iPhone12,1 ROBLOX iOS App                                                                 |
| iOS         | 83     | iPhone11Pro                | Phone      | iPhone 11 Pro                 | iPhone12,3 ROBLOX iOS App                                                                 |
| iOS         | 84     | iPhone11ProMax             | Phone      | iPhone 11 Pro Max             | iPhone12,5 ROBLOX iOS App                                                                 |
| Windows     | 85     | DesktopWindowsUniversalApp | Computer   | Desktop Windows Universal App | Roblox/WinInet RobloxApp/0                                                                |
| OSX         | 86     | DesktopMacUniversalApp     | Computer   | Desktop Mac Universal App     | Roblox/Darwin RobloxApp/0                                                                 |
| Android     | 88     | AmazonUnknownTablet        | Tablet     | Amazon: unknown tablet        | ROBLOX Android AmazonAppStore                                                             |
| Android     | 89     | AmazonLowEndTablet         | Tablet     | Amazon: low-end tablet        | (1MB; 0x0; 0x0; 0x0; ; 0) ROBLOX Android AmazonAppStore                                   |
| Android     | 90     | AmazonMediumEndTablet      | Tablet     | Amazon: mid-end tablet        | (1251MB; 0x0; 0x0; 0x0; ; 0) ROBLOX Android AmazonAppStore                                |
| Android     | 91     | AmazonHighEndTablet        | Tablet     | Amazon: high-end tablet       | (2101MB; 0x0; 0x0; 0x0; ; 0) ROBLOX Android AmazonAppStore                                |
| iOS         | 92     | iPhone12Mini               | Phone      | iPhone 12 Mini                | iPhone13,1 ROBLOX iOS App                                                                 |
| iOS         | 93     | iPhone12                   | Phone      | iPhone 12                     | iPhone13,2 ROBLOX iOS App                                                                 |
| iOS         | 94     | iPhone12Pro                | Phone      | iPhone 12 Pro                 | iPhone13,3 ROBLOX iOS App                                                                 |
| iOS         | 95     | iPhone12ProMax             | Phone      | iPhone 12 Pro Max             | iPhone13,4 ROBLOX iOS App                                                                 |
| iOS         | 96     | iPhone13Mini               | Phone      | iPhone 13 Mini                | iPhone14,4 ROBLOX iOS App                                                                 |
| iOS         | 97     | iPhone13                   | Phone      | iPhone 13                     | iPhone14,5 ROBLOX iOS App                                                                 |
| iOS         | 98     | iPhone13Pro                | Phone      | iPhone 13 Pro                 | iPhone14,2 ROBLOX iOS App                                                                 |
| iOS         | 99     | iPhone13ProMax             | Phone      | iPhone 13 Pro Max             | iPhone14,3 ROBLOX iOS App                                                                 |
| Android     | 100    | OculusQuest2               | VR         | Oculus Quest 2                | (1MB; 0x0; 0x0; 0x0; oculus Oculus Quest; 0) ROBLOX Android VR OculusQuest3Store          |
| iOS         | 101    | iPad8                      | Tablet     | iPad 8                        | iPad11,6 ROBLOX iOS App                                                                   |
| iOS         | 102    | iPad9                      | Tablet     | iPad 9                        | iPad12,1 ROBLOX iOS App                                                                   |
| iOS         | 103    | iPadAir4                   | Tablet     | iPad Air 4                    | iPad13,1 ROBLOX iOS App                                                                   |
| iOS         | 104    | iPadAir5                   | Tablet     | iPad Air 5                    | iPad13,16 ROBLOX iOS App                                                                  |
| iOS         | 105    | iPhone14                   | Phone      | iPhone 14                     | iPhone14,7 ROBLOX iOS App                                                                 |
| iOS         | 106    | iPhone14Pro                | Phone      | iPhone 14 Pro                 | iPhone15,2 ROBLOX iOS App                                                                 |
| iOS         | 107    | iPhone14Plus               | Phone      | iPhone 14 Plus                | iPhone14,8 ROBLOX iOS App                                                                 |
| iOS         | 108    | iPhone14ProMax             | Phone      | iPhone 14 Pro Max             | iPhone15,3 ROBLOX iOS App                                                                 |
| PlayStation | 109    | PlayStation4               | Console    | PlayStation 4                 | PlayStation 4                                                                             |
| PlayStation | 110    | PlayStation5               | Console    | PlayStation 5                 | PlayStation 5                                                                             |
| Android     | 111    | OculusQuest2Hollywood      | VR         | Oculus Quest 2 Hollywood      | (1MB; 0x0; 0x0; 0x0; oculus Oculus Questhollywood; 0) ROBLOX Android VR OculusQuest3Store |
| Android     | 112    | OculusQuest3Eureka         | VR         | Oculus Quest 3 Eureka         | (1MB; 0x0; 0x0; 0x0; oculus Oculus Questeureka; 0) ROBLOX Android VR OculusQuest3Store    |
| Android     | 113    | OculusQuestProSeacliff     | VR         | Oculus Quest Pro Seacliff     | (1MB; 0x0; 0x0; 0x0; oculus Oculus Questseacliff; 0) ROBLOX Android VR OculusQuest3Store  |
| iOS         | 114    | iPad10                     | Tablet     | iPad 10                       | iPad13,18 ROBLOX iOS App                                                                  |
| iOS         | 115    | iPadMini6G                 | Tablet     | iPad mini 6G                  | iPad14,2 ROBLOX iOS App                                                                   |
| iOS         | 116    | iPadPro11_2                | Tablet     | iPad Pro 11 (2nd Gen)         | iPad8,10 ROBLOX iOS App                                                                   |
| iOS         | 117    | iPadPro11_3                | Tablet     | iPad Pro 11 (3rd Gen)         | iPad13,5 ROBLOX iOS App                                                                   |
| iOS         | 118    | iPadPro11_4                | Tablet     | iPad Pro 11 (4th Gen)         | iPad14,3 ROBLOX iOS App                                                                   |
| iOS         | 119    | iPadPro12_9_4              | Tablet     | iPad Pro 12.9 (4th Gen)       | iPad8,11 ROBLOX iOS App                                                                   |
| iOS         | 120    | iPadPro12_9_5              | Tablet     | iPad Pro 12.9 (5th Gen)       | iPad13,8 ROBLOX iOS App                                                                   |
| iOS         | 121    | iPadPro12_9_6              | Tablet     | iPad Pro 12.9 (6th Gen)       | iPad14,6 ROBLOX iOS App                                                                   |
| iOS         | 122    | iPhoneSE2                  | Phone      | iPhone SE (2nd Gen)           | iPhone12,8 ROBLOX iOS App                                                                 |
| iOS         | 123    | iPhoneSE3                  | Phone      | iPhone SE (3rd Gen)           | iPhone14,6 ROBLOX iOS App                                                                 |
| iOS         | 124    | iPhone15                   | Phone      | iPhone 15                     | iPhone15,4 ROBLOX iOS App                                                                 |
| iOS         | 125    | iPhone15Pro                | Phone      | iPhone 15 Pro                 | iPhone16,1 ROBLOX iOS App                                                                 |
| iOS         | 126    | iPhone15ProMax             | Phone      | iPhone 15 Pro Max             | iPhone16,2 ROBLOX iOS App                                                                 |
| iOS         | 127    | iPhone15Plus               | Phone      | iPhone 15 Plus                | iPhone15,5 ROBLOX iOS App                                                                 |
| iOS         | 129    | iPadAir11_M2               | Tablet     | iPad Air 11 (M2)              | iPad14,8 ROBLOX iOS App                                                                   |
| iOS         | 130    | iPadAir13_M2               | Tablet     | iPad Air 13 (M2)              | iPad14,10 ROBLOX iOS App                                                                  |
| iOS         | 131    | iPadPro11_M4               | Tablet     | iPad Pro 11 (M4)              | iPad16,3 ROBLOX iOS App                                                                   |
| iOS         | 132    | iPadPro13_M4               | Tablet     | iPad Pro 13 (M4)              | iPad16,5 ROBLOX iOS App                                                                   |
| iOS         | 133    | iPhone16                   | Phone      | iPhone 16                     | iPhone17,3 ROBLOX iOS App                                                                 |
| iOS         | 134    | iPhone16Pro                | Phone      | iPhone 16 Pro                 | iPhone17,1 ROBLOX iOS App                                                                 |
| iOS         | 135    | iPhone16ProMax             | Phone      | iPhone 16 Pro Max             | iPhone17,2 ROBLOX iOS App                                                                 |
| iOS         | 136    | iPhone16Plus               | Phone      | iPhone 16 Plus                | iPhone17,4 ROBLOX iOS App                                                                 |