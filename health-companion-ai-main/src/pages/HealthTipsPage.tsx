import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Pill, Home as HomeIcon } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const HealthTipsPage = () => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("medicines");

  // Mock Data - In a real app, this should come from a backend or rigorous translation file
  const diseasesData = [
    {
      id: "cold",
      name: t("common_cold") || "Common Cold",
      medicines: {
        en: ["Paracetamol (for fever/pain)", "Cetirizine (for runny nose)", "Decongestants (e.g. Pseudoephedrine)", "Cough Syrup"],
        te: ["పారాసిటమాల్ (జ్వరం/నొప్పికి)", "సెటిరిజిన్ (ముక్కు కారడం కోసం)", "డీకంజెస్టెంట్స్", "దగ్గు సిరప్"]
      },
      remedies: {
        en: ["Steam inhalation (with eucalyptus oil)", "Warm salt water gargle", "Drink hot water with ginger & honey", "Turmeric milk (Golden Milk)"],
        te: ["ఆవిరి పట్టడం (యూకలిప్టస్ నూనెతో)", "గోరువెచ్చని ఉప్పు నీటి పుక్కిలింత", "అల్లం, తేనె కలిపిన వేడి నీళ్లు తాగడం", "పసుపు పాలు తాగడం"]
      }
    },
    {
      id: "fever",
      name: t("fever") || "Fever",
      medicines: {
        en: ["Paracetamol (Dolo 650/Crocin)", "Ibuprofen (if inflammation present)"],
        te: ["పారాసిటమాల్ (డోలో 650/క్రోసిన్)", "ఐబుప్రోఫెన్ (వాపు ఉంటే)"]
      },
      remedies: {
        en: ["Stay hydrated (drink plenty of water/ORS)", "Cold sponge bath (tepid water)", "Wear light clothing", "Tulsi tea"],
        te: ["హైడ్రేటెడ్ గా ఉండండి (నీరు/ORS ఎక్కువగా తాగండి)", "చల్లటి నీటి తడి గుడ్డ పెట్టుకోవడం", "కాంతివంతమైన దుస్తులు ధరించండి", "తులసి టీ"]
      }
    },
    {
      id: "headache",
      name: t("headache") || "Headache",
      medicines: {
        en: ["Paracetamol", "Aspirin (Adults only)", "Ibuprofen"],
        te: ["పారాసిటమాల్", "ఆస్పిరిన్ (పెద్దలకు మాత్రమే)", "ఐబుప్రోఫెన్"]
      },
      remedies: {
        en: ["Apply peppermint oil to temples", "Drink water (dehydration causes headaches)", "Cold or warm compress", "Ginger tea"],
        te: ["కణతలకు పిప్పరమింట్ ఆయిల్ రాయండి", "నీరు తాగండి (డీహైడ్రేషన్ తలనొప్పిని కలిగిస్తుంది)", "చల్లని లేదా వేడి కాపడం", "అల్లం టీ"]
      }
    },
    {
      id: "stomach",
      name: t("stomach_pain") || "Stomach Ache",
      medicines: {
        en: ["Antacids (Gelusil/Digene)", "Dicyclomine (for cramps)", "Simethicone (for gas)"],
        te: ["యాంటాసిడ్ (జెలుసిల్/డైజీన్)", "డైసైక్లోమైన్ (తిమ్మిర్లకు)", "సిమెథికోన్ (గ్యాస్ కోసం)"]
      },
      remedies: {
        en: ["Ginger tea or chew ginger", "Heating pad on stomach", "Peppermint tea", "Avoid solid food for a few hours"],
        te: ["అల్లం టీ లేదా అల్లం నమలడం", "కడుపుపై వేడి కాపడం", "పిప్పరమింట్ టీ", "కొన్ని గంటల పాటు ఆహారం మానేయండి"]
      }
    },
    {
      id: "cough",
      name: t("cough") || "Cough",
      medicines: {
        en: ["Cough syrup (Dextromethorphan for dry cough)", "Expectorant (Guaifenesin for wet cough)", "Lozenges (Vicks/Strepsils)"],
        te: ["దగ్గు సిరప్ (పొడి దగ్గుకు డెక్స్‌ట్రోమెథార్ఫాన్)", "ఎక్స్‌పెక్టరెంట్ (తడి దగ్గుకు గ్వాఫెనెసిన్)", "గొంతు బిళ్లలు (విక్స్/స్ట్రెప్సిల్స్)"]
      },
      remedies: {
        en: ["Honey and lemon with warm water", "Steam inhalation", "Licorice (Mulethi) tea", "Gargle with salt water"],
        te: ["తేనె మరియు నిమ్మరసం వెచ్చని నీటితో", "ఆవిరి పట్టడం", "ములేతి (యష్టిమధు) టీ", "ఉప్పు నీటి పుక్కిలింత"]
      }
    },
    {
      id: "throat",
      name: t("sore_throat") || "Sore Throat",
      medicines: {
        en: ["Lozenges", "Anti-inflammatory pain relievers", "Throat sprays"],
        te: ["గొంతు బిళ్లలు", "యాంటీ ఇన్ఫ్లమేటరీ నొప్పి నివారణలు", "గొంతు స్ప్రేలు"]
      },
      remedies: {
        en: ["Salt water gargle", "Honey tea", "Fenugreek tea", "Garlic (chew raw)"],
        te: ["ఉప్పు నీటి పుక్కిలింత", "తేనె టీ", "మెంతి టీ", "వెల్లుల్లి (పచ్చిగా నమలడం)"]
      }
    },
    {
      id: "diarrhea",
      name: t("diarrhea") || "Diarrhea",
      medicines: {
        en: ["Loperamide (Imodium)", "ORS (Oral Rehydration Solution)", "Probiotics"],
        te: ["లోపెరామైడ్ (ఇమోడియం)", "ORS (ఓరల్ రీహైడ్రేషన్ సొల్యూషన్)", "ప్రోబయోటిక్స్"]
      },
      remedies: {
        en: ["Stay hydrated (Water, Coconut water)", "BRAT diet (Bananas, Rice, Applesauce, Toast)", "Yogurt/Curd", "Avoid dairy and fatty foods"],
        te: ["హైడ్రేటెడ్ గా ఉండండి (నీరు, కొబ్బరి నీరు)", "BRAT డైట్ (అరటిపండ్ల, అన్నం, యాపిల్ సాస్, టోస్ట్)", "పెరుగు", "పాల ఉత్పత్తులు మరియు కొవ్వు పదార్ధాలను నివారించండి"]
      }
    },
    {
      id: "acidity",
      name: t("acidity") || "Acidity / Gas",
      medicines: {
        en: ["Antacids (Enos, Digene)", "Proton pump inhibitors (Omeprazole) - consult doc", "H2 blockers (Ranitidine)"],
        te: ["యాంటాసిడ్ (ఈనో, డైజీన్)", "ప్రోటాన్ పంప్ ఇన్హిబిటర్స్ (ఒమెప్రజోల్) - వైద్యుడిని సంప్రదించండి", "రాంటిడిన్"]
      },
      remedies: {
        en: ["Cold milk", "Fennel seeds (Saunf) water", "Jaggery (Gud) after meal", "Basil leaves (Tulsi)"],
        te: ["చల్లటి పాలు", "సోంపు నీరు", "భోజనం తర్వాత బెల్లం", "తులసి ఆకులు"]
      }
    },
    {
      id: "skin",
      name: t("skin_rash") || "Skin Rash",
      medicines: {
        en: ["Calamine lotion", "Hydrocortisone cream (for itching)", "Antihistamines (Cetirizine)"],
        te: ["కాలమైన్ లోషన్", "హైడ్రోకార్టిసోన్ క్రీమ్ (దురద కోసం)", "యాంటిహిస్టామైన్లు (సెటిరిజిన్)"]
      },
      remedies: {
        en: ["Aloe Vera gel", "Coconut oil", "Oatmeal bath", "Cold compress"],
        te: ["కలబంద జెల్", "కొబ్బరి నూనె", "ఓట్ మీల్ స్నానం", "చల్లని కాపడం"]
      }
    },
    {
      id: "bodypain",
      name: t("body_pain") || "Body Pain",
      medicines: {
        en: ["Pain relievers (Ibuprofen, Paracetamol)", "Muscle relaxants (only if severe)", "Topical ointments (Volini/Iodex)"],
        te: ["నొప్పి నివారణలు (ఐబుప్రోఫెన్, పారాసిటమాల్)", "కండరాల సడలింపు మందులు (తీవ్రంగా ఉంటే)", "పై పూత మందులు (వొలిని/అయోడెక్స్)"]
      },
      remedies: {
        en: ["Warm bath with Epsom salt", "Turmeric milk", "Massage with warm oil", "Rest and stretching"],
        te: ["ఎప్సం సాల్ట్ తో వేడి స్నానం", "పసుపు పాలు", "వేడి నూనెతో మసాజ్", "విశ్రాంతి మరియు స్ట్రెచింగ్"]
      }
    }
  ];

  const filteredData = diseasesData.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 fade-in p-4 md:p-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("nav_health_tips")}</h1>
            <p className="text-muted-foreground mt-1">{language === 'te' ? "సాధారణ ఆరోగ్య సమస్యలకు పరిష్కారాలు మరియు చిట్కాలు" : "Solutions and tips for common health issues"}</p>
          </div>
          <div className="relative w-full md:w-72">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder={language === 'te' ? "శోధించండి..." : "Search diseases..."} 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="medicines" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
             <TabsTrigger value="medicines" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300">
                <Pill className="w-4 h-4 mr-2" />
                {t("medicines")}
             </TabsTrigger>
             <TabsTrigger value="remedies" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300">
                <HomeIcon className="w-4 h-4 mr-2" />
                {t("home_remedies")}
             </TabsTrigger>
          </TabsList>

          <TabsContent value="medicines" className="mt-0">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredData.map((item) => (
                 <motion.div
                   key={item.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 0.2 }}
                 >
                   <Card className="h-full border-l-4 border-l-primary hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                {item.name}
                            </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                          <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                             {item.medicines[language === 'te' ? 'te' : 'en'].map((med, idx) => (
                               <li key={idx} className="leading-relaxed">{med}</li>
                             ))}
                          </ul>
                      </CardContent>
                   </Card>
                 </motion.div>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="remedies" className="mt-0">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredData.map((item) => (
                 <motion.div
                   key={item.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 0.2 }}
                 >
                   <Card className="h-full border-l-4 border-l-primary hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                {item.name}
                            </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                          <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                             {item.remedies[language === 'te' ? 'te' : 'en'].map((rem, idx) => (
                               <li key={idx} className="leading-relaxed">{rem}</li>
                             ))}
                          </ul>
                      </CardContent>
                   </Card>
                 </motion.div>
               ))}
             </div>
          </TabsContent>
        </Tabs>

      </div>
    </DashboardLayout>
  );
};

export default HealthTipsPage;
