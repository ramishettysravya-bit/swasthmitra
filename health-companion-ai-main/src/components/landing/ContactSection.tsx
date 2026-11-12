import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ContactSection = () => {
    const { t } = useLanguage();

    const contacts = [
        {
            icon: Mail,
            title: t("contact_email"),
            value: "gangireddydeepika12@gmail.com",
            link: "mailto:gangireddydeepika12@gmail.com",
            color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
        },
        {
            icon: Phone,
            title: t("contact_phone"),
            value: "+91 7013118554",
            link: "tel:+917013118554",
            color: "bg-green-500/10 text-green-600 dark:text-green-400"
        },
        {
            icon: MapPin,
            title: t("contact_location"),
            value: t("address_text"),
            link: "https://www.google.com/maps/search/?api=1&query=Andhra+Pradesh",
            color: "bg-red-500/10 text-red-600 dark:text-red-400"
        }
    ];

    return (
        <section className="relative z-10 px-6 py-16">
            <div className="container mx-auto max-w-4xl">
                <div className="text-center mb-10">
                    <motion.h2 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl md:text-4xl font-bold font-display mb-3"
                    >
                        {t("contact_title")}
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-base text-muted-foreground max-w-xl mx-auto"
                    >
                        {t("contact_subtitle")}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {contacts.map((contact, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card-strong p-8 rounded-2xl text-center hover:translate-y-[-3px] transition-all duration-300 border-t-4 border-t-primary h-full shadow-sm hover:shadow-md group flex flex-col items-center justify-center relative hover:border-primary/50 mx-4"
                        >
                            {contact.link ? (
                                <a 
                                    href={contact.link} 
                                    target={contact.icon === MapPin ? "_blank" : undefined}
                                    rel={contact.icon === MapPin ? "noopener noreferrer" : undefined}
                                    className="flex flex-col items-center w-full h-full cursor-pointer"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${contact.color} transition-transform duration-300 group-hover:scale-110`}>
                                        <contact.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{contact.title}</h3>
                                    <p className="text-sm text-muted-foreground font-medium break-all group-hover:text-foreground transition-colors">
                                        {contact.value}
                                    </p>
                                </a>
                            ) : (
                                <div className="flex flex-col items-center w-full h-full">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${contact.color}`}>
                                        <contact.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{contact.title}</h3>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {contact.value}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
